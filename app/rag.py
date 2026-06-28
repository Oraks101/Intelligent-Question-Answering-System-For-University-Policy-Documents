import os
from typing import List, Dict, Any
import chromadb
from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    StorageContext,
    Settings,
    PromptTemplate
)
from llama_index.core.tools import QueryEngineTool, ToolMetadata
from llama_index.core.query_engine import RouterQueryEngine
from llama_index.core.selectors import LLMSingleSelector
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.gemini import GeminiEmbedding
from llama_index.llms.gemini import Gemini
from dotenv import load_dotenv
import logging

logger = logging.getLogger("university-policy-rag")

load_dotenv()

# ---------------------------------------------------------------
# Configuration — all paths are configurable via environment vars.
# On a platform with a persistent disk (Railway, Render, Fly.io),
# set DATA_DIR and CHROMA_DB_PATH to mount-point paths.
# ---------------------------------------------------------------
DATA_DIR = os.environ.get("DATA_DIR", "./data")
CHROMA_DB_PATH = os.environ.get("CHROMA_DB_PATH", "./chroma_db")

# ---------------------------------------------------------------
# Validate critical environment variables at import time so the
# app fails fast with a clear error rather than a cryptic one.
# ---------------------------------------------------------------
_gemini_key = os.environ.get("GEMINI_API_KEY", "")
if not _gemini_key:
    logger.warning(
        "GEMINI_API_KEY is not set. "
        "The RAG system will not function. Set this in your host environment variables."
    )

# LlamaIndex settings will be initialized dynamically inside RAGManager

# --- System Prompt Definition ---
SYSTEM_PROMPT = (
    "You are the Intelligent University Policy Assistant. Use the provided context to answer questions strictly based on official university policy. "
    "If the information required to answer the question is not present in the provided context, you must respond exactly with: "
    "'I'm sorry, I cannot find that in the official policy. Please contact the Registrar.' "
    "Do not provide advice, opinions, or information outside of the provided policy documents. Maintain a formal, professional tone."
)

QA_PROMPT_TMPL = (
    "Context information is below.\n"
    "---------------------\n"
    "{context_str}\n"
    "---------------------\n"
    "Given the context information and not prior knowledge, answer the query.\n"
    "Query: {query_str}\n"
    "Answer: "
)

# Apply system prompt to the global settings
Settings.system_prompt = SYSTEM_PROMPT


class RAGManager:
    def __init__(self):
        self.db = None
        self.chroma_collection = None
        self.vector_store = None
        self.storage_context = None
        self.vector_index = None
        self.query_engine = None
        self._initialized = False
        self.initialize_if_needed()

    def initialize_if_needed(self) -> bool:
        """Attempt to initialize the RAG system if it has not been initialized yet."""
        if self._initialized and self.query_engine is not None:
            return True

        try:
            # Reload environment variables in case .env was updated after startup
            from dotenv import load_dotenv
            load_dotenv()
            
            gemini_key = os.environ.get("GEMINI_API_KEY", "")
            if not gemini_key or "your_gemini_api_key_here" in gemini_key:
                logger.warning(
                    "RAG system initialization deferred: GEMINI_API_KEY is missing or contains the placeholder. "
                    "Update your .env file with a valid key."
                )
                return False
                
            Settings.llm = Gemini(model="models/gemini-2.5-flash", api_key=gemini_key)
            Settings.embed_model = GeminiEmbedding(model_name="models/gemini-embedding-001", api_key=gemini_key)
            
            self._setup_chroma()
            self._initialize_index()
            
            if self.query_engine is not None:
                self._initialized = True
                logger.info("RAG index successfully initialized.")
                return True
        except Exception as e:
            logger.error(
                f"Failed to initialize RAG index: {str(e)}. "
                "The system will start but queries will not work until this is resolved. "
                "Ensure GEMINI_API_KEY is set and CHROMA_DB_PATH is writable."
            )
            
        return False

    def _setup_chroma(self):
        """Set up ChromaDB client and collection."""
        os.makedirs(CHROMA_DB_PATH, exist_ok=True)
        self.db = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        self.chroma_collection = self.db.get_or_create_collection("university_policies")
        self.vector_store = ChromaVectorStore(chroma_collection=self.chroma_collection)
        self.storage_context = StorageContext.from_defaults(vector_store=self.vector_store)

    def _initialize_index(self):
        """Load documents and initialize Vector and Summary indices with a Router."""
        os.makedirs(DATA_DIR, exist_ok=True)

        # If Chroma collection already has embeddings, load the index directly from the vector store
        if self.chroma_collection and self.chroma_collection.count() > 0:
            logger.info("Loading existing index from ChromaDB vector store...")
            self.vector_index = VectorStoreIndex.from_vector_store(
                self.vector_store,
                storage_context=self.storage_context
            )
            self._setup_query_engine()
            return

        # Check if directory has files before reading
        pdf_files = [f for f in os.listdir(DATA_DIR) if f.endswith(".pdf")]
        if not pdf_files:
            logger.info("No PDF documents found in DATA_DIR. Upload a document to begin.")
            self.query_engine = None
            return

        documents = SimpleDirectoryReader(DATA_DIR).load_data()

        if not documents:
            self.query_engine = None
            return

        # Initialize or Refresh Indices
        self.vector_index = VectorStoreIndex.from_documents(
            documents,
            storage_context=self.storage_context
        )

        self._setup_query_engine()

    def _setup_query_engine(self):
        """Configure the Query Engine."""
        if not self.vector_index:
            return

        # Define Custom Prompt Templates
        qa_prompt = PromptTemplate(QA_PROMPT_TMPL)

        # Initialize Query Engine
        self.query_engine = self.vector_index.as_query_engine(
            text_qa_template=qa_prompt
        )

    def refresh_index(self):
        """Incrementally refresh the index after new uploads or updates."""
        self.initialize_if_needed()
        if not os.path.exists(DATA_DIR):
            return

        pdf_files = [f for f in os.listdir(DATA_DIR) if f.endswith(".pdf")]
        if not pdf_files:
            return

        documents = SimpleDirectoryReader(DATA_DIR).load_data()
        if not documents:
            return

        if self.vector_index:
            # refresh_ref_docs handles additions and updates based on doc_id (hash)
            self.vector_index.refresh_ref_docs(documents)
            self._setup_query_engine()
        else:
            self._initialize_index()

    def delete_document(self, file_name: str):
        """Delete a document from the data directory and the vector store."""
        file_path = os.path.join(DATA_DIR, file_name)
        if os.path.exists(file_path):
            os.remove(file_path)

        # Delete from ChromaDB by metadata filter
        if self.chroma_collection:
            self.chroma_collection.delete(where={"file_name": file_name})

        # Refresh the index to rebuild the query engine
        self.refresh_index()

    def query(self, query_str: str) -> Dict[str, Any]:
        """Query the index and return response with enhanced citations."""
        self.initialize_if_needed()
        if not self.query_engine:
            return {
                "response": "No documents have been indexed yet. Please upload a policy PDF using the sidebar.",
                "sources": []
            }

        try:
            response = self.query_engine.query(query_str)
        except Exception as e:
            logger.error(f"Query engine failure: {str(e)}")
            return {
                "response": f"The query system encountered an internal error: {str(e)}",
                "sources": []
            }

        sources = []
        for node in response.source_nodes:
            metadata = node.node.metadata
            sources.append({
                "content": node.node.get_content()[:200] + "...",
                "file_name": metadata.get("file_name", "Unknown"),
                "page_number": metadata.get("page_label", "Unknown"),
                "score": getattr(node, "score", None)
            })

        return {
            "response": str(response),
            "sources": sources
        }


rag_manager = RAGManager()
