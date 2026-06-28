import React from 'react';
import { Upload, FileText, X, LogOut, User } from 'lucide-react';
import heroImage from '../assets/Nile-University-hero.jpg';

const Sidebar = ({ policies, onUpload, onDelete, isUploading, isIndexing, studentEmail, onLogout }) => {
    return (
        <div className="w-64 bg-university-blue text-white h-full flex flex-col shadow-xl">
            <div className="p-6 border-b border-white/10 flex flex-col items-center gap-3">
                <img src={heroImage} alt="Nile University" className="w-20 h-20 rounded-full border-2 border-white/20 object-cover shadow-lg" />
                <div className="text-center">
                    <h1 className="text-xl font-bold tracking-tight">Nile University AI</h1>
                    <p className="text-[10px] text-blue-200 uppercase tracking-widest mt-1">Policy Knowledge Base</p>
                </div>
            </div>

            <div className="p-4">
                <label className={`flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition-colors border border-white/20 rounded-lg p-3 cursor-pointer group ${(isUploading || isIndexing) ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm">Upload Policy (PDF)</span>
                    <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={onUpload}
                        disabled={isUploading || isIndexing}
                    />
                </label>
                {isUploading && (
                    <div className="mt-2 text-center text-xs text-blue-200 animate-pulse">
                        Uploading...
                    </div>
                )}
                {isIndexing && (
                    <div className="mt-2 text-center text-xs text-yellow-200 animate-pulse flex items-center justify-center gap-1">
                        <span className="inline-block w-2 h-2 bg-yellow-300 rounded-full animate-bounce"></span>
                        Indexing document...
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
                <h2 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-4 px-2">
                    Uploaded Policies
                </h2>
                <div className="space-y-1">
                    {policies.length > 0 ? (
                        policies.map((policy, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 p-3 text-sm rounded-lg hover:bg-white/5 transition-colors cursor-default group"
                            >
                                <FileText className="w-4 h-4 text-blue-400 group-hover:text-white transition-colors" />
                                <span className="truncate opacity-80 group-hover:opacity-100 transition-opacity">
                                    {policy}
                                </span>
                                <button
                                    onClick={() => onDelete(policy)}
                                    className="ml-auto text-red-300 hover:text-red-100 bg-red-500/10 hover:bg-red-500/30 transition-all p-1.5 rounded-md flex items-center justify-center"
                                    title="Delete Policy"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-sm text-blue-300/50 italic border-2 border-dashed border-white/10 rounded-xl">
                            No policies yet
                        </div>
                    )}
                </div>
            </div>

            {/* Student Profile & Logout */}
            {studentEmail && (
                <div className="p-4 border-t border-white/10 bg-university-dark-blue/30">
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-300">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                                {studentEmail.split('@')[0]}
                            </p>
                            <p className="text-[10px] text-blue-200/50 truncate">
                                @{studentEmail.split('@')[1]}
                            </p>
                        </div>
                        <button
                            onClick={onLogout}
                            className="p-2 text-blue-300 hover:text-red-200 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Log Out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="p-4 border-t border-white/10 bg-university-dark-blue/50 text-xs text-blue-300/60 font-medium">
                &copy; 2026 University RAG System
            </div>
        </div>
    );
};

export default Sidebar;
