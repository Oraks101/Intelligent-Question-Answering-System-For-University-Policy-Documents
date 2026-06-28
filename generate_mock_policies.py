import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def create_policy_pdf(filename, title, sections):
    doc = SimpleDocTemplate(filename, pagesize=letter,
                            rightMargin=54, leftMargin=54,
                            topMargin=54, bottomMargin=54)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#1A365D"), # Deep Navy
        spaceAfter=20
    )
    
    h2_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#2B6CB0"), # Blue
        spaceBefore=15,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#2D3748") # Dark Grey
    )
    
    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=body_style,
        leftIndent=20,
        firstLineIndent=-10,
        spaceAfter=5
    )
    
    # Title
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 15))
    
    # Sections
    for sec_title, sec_content in sections:
        story.append(Paragraph(sec_title, h2_style))
        for item in sec_content:
            if item.startswith("- "):
                story.append(Paragraph(item, bullet_style))
            else:
                story.append(Paragraph(item, body_style))
                story.append(Spacer(1, 8))
        story.append(Spacer(1, 10))
        
    doc.build(story)

def main():
    os.makedirs("sample_policies", exist_ok=True)
    os.makedirs("data", exist_ok=True)
    
    # 1. Academic Regulations
    academic_sections = [
        ("1. Grading System and GPA Scale", [
            "Apex University utilizes a standard 4.0 scale for grade point averages (GPA):",
            "- Grade A: 4.0 grade points (Outstanding, 90-100%)",
            "- Grade B: 3.0 grade points (Good, 80-89%)",
            "- Grade C: 2.0 grade points (Satisfactory, 70-79%)",
            "- Grade D: 1.0 grade points (Poor, 60-69%)",
            "- Grade F: 0.0 grade points (Fail, below 60%)",
            "Dean's List: Undergraduate students who achieve a semester GPA of 3.50 or higher while completing at least 12 credit hours will be placed on the Dean's List."
        ]),
        ("2. Academic Standing and Probation", [
            "All students must maintain a minimum cumulative GPA of 2.0 to remain in Good Standing.",
            "- Academic Warning: A student whose cumulative GPA falls below 2.0 in any semester will receive an Academic Warning.",
            "- Academic Probation: If the cumulative GPA remains below 2.0 for two consecutive semesters, the student is placed on Academic Probation.",
            "- Academic Suspension: Students on probation who fail to raise their GPA to 2.0 after a third consecutive semester will face a mandatory one-semester Academic Suspension."
        ]),
        ("3. Attendance Policy", [
            "Regular class attendance is required of all students. A student must attend a minimum of 80% of all scheduled class sessions to receive credit for a course.",
            "- Excused Absences: Absences for medical reasons (requires a doctor's note signed within 48 hours), bereavement (up to 3 days), or official university-sponsored athletic events are excused.",
            "- Consequences of Absences: Unexcused absences exceeding 20% of the total course hours will automatically result in a grade of 'F' (Failure) for the course."
        ]),
        ("4. Course Registration and Withdrawals", [
            "Students may modify their schedules during the official Add/Drop period, which ends exactly 14 calendar days from the start of the semester.",
            "- Late Registration: A fee of $100 will apply to any registration changes requested after the Add/Drop deadline.",
            "- Course Withdrawal: Students may withdraw from a course up to the end of the 10th week of the semester. A grade of 'W' will be recorded on their transcript. No refunds are issued for withdrawals after the Add/Drop period."
        ])
    ]
    
    # 2. Student Code of Conduct
    conduct_sections = [
        ("1. Academic Integrity and Misconduct", [
            "Academic integrity is fundamental to Apex University. Violations include plagiarism, cheating, collusion, and the unauthorized use of generative AI tools on graded assignments.",
            "- Plagiarism: Presenting another person's work, ideas, or words as one's own without appropriate citation.",
            "- Cheating: Using unauthorized materials, assistance, or devices during examinations or quizzes.",
            "- Collusion: Collaborating with others on assignments that are intended to be completed individually."
        ]),
        ("2. Disciplinary Actions for Academic Dishonesty", [
            "The following disciplinary actions are applied progressively for academic dishonesty infractions:",
            "- First Offense: An automatic score of zero on the assignment or exam, plus a mandatory warning letter sent to the Dean of Students.",
            "- Second Offense: Suspension from the university for one full academic semester, and a permanent notation of academic misconduct added to the student's record.",
            "- Third Offense: Permanent expulsion from Apex University with no option for reinstatement."
        ]),
        ("3. Alcohol and Substance Abuse Policy", [
            "Apex University maintains a strict substance-free campus environment.",
            "- Alcohol Consumption: The possession, sale, or consumption of alcohol is strictly prohibited on all university property, including residence halls, regardless of the student's age.",
            "- Substance Abuse: The use, possession, or distribution of illegal drugs or controlled substances is a violation of federal law and university policy, resulting in immediate suspension and referral to local law enforcement."
        ]),
        ("4. Housing and Residence Life Regulations", [
            "All residents must adhere to quiet hours from 10:00 PM to 8:00 AM on weekdays, and 12:00 AM to 9:00 AM on weekends.",
            "- Guest Policy: Overnight guests must be registered at the residence hall front desk at least 24 hours in advance. No guest may stay for more than 3 consecutive nights.",
            "- Key Responsibility: Lost room keys must be reported immediately. A replacement fee of $75 will be charged to the student's account for lock replacement."
        ])
    ]
    
    # Generate in sample_policies
    create_policy_pdf("sample_policies/University_Academic_Regulations.pdf", "Apex University: Academic Regulations", academic_sections)
    create_policy_pdf("sample_policies/Student_Code_of_Conduct.pdf", "Apex University: Student Code of Conduct & Regulations", conduct_sections)
    
    # Also place copies in the default backend data folder so they are pre-loaded
    create_policy_pdf("data/University_Academic_Regulations.pdf", "Apex University: Academic Regulations", academic_sections)
    create_policy_pdf("data/Student_Code_of_Conduct.pdf", "Apex University: Student Code of Conduct & Regulations", conduct_sections)
    
    print("Success: Generated sample PDFs in 'sample_policies/' and preloaded them in 'data/'!")

if __name__ == "__main__":
    main()
