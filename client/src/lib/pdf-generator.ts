import { jsPDF } from "jspdf";
import { ResumeContent, ResumeTemplate, Resume } from "@shared/schema";
import { apiRequest } from "./queryClient";

// Helper function to set font styles
const setFontStyle = (doc: jsPDF, style: 'normal' | 'bold' | 'italic', size: number) => {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
};

// Templates have different styling configurations
const templateStyles: Record<ResumeTemplate, {
  headerColor: string;
  accentColor: string;
  bodyFont: string;
  headerFont: string;
}> = {
  modern: {
    headerColor: '#3b82f6',
    accentColor: '#93c5fd',
    bodyFont: 'helvetica',
    headerFont: 'helvetica',
  },
  professional: {
    headerColor: '#1e40af',
    accentColor: '#60a5fa',
    bodyFont: 'helvetica',
    headerFont: 'helvetica',
  },
  creative: {
    headerColor: '#8b5cf6',
    accentColor: '#c4b5fd',
    bodyFont: 'helvetica',
    headerFont: 'helvetica',
  },
  simple: {
    headerColor: '#000000',
    accentColor: '#d1d5db',
    bodyFont: 'helvetica',
    headerFont: 'helvetica',
  },
  elegant: {
    headerColor: '#1f2937',
    accentColor: '#9ca3af',
    bodyFont: 'helvetica',
    headerFont: 'helvetica',
  }
};

// Function to generate a PDF from a resume
export const generateResumePDF = async (resume: Resume): Promise<string> => {
  const content = resume.content as ResumeContent;
  const template = resume.template as ResumeTemplate;
  
  // Create a new document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const style = templateStyles[template] || templateStyles.modern;
  
  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  
  // Header section
  setFontStyle(doc, 'bold', 24);
  doc.setTextColor(style.headerColor);
  doc.text(content.personalInfo.fullName || 'Full Name', margin, margin + 10);
  
  setFontStyle(doc, 'normal', 14);
  doc.text(content.personalInfo.professionalTitle || 'Professional Title', margin, margin + 18);
  
  // Contact information
  let contactY = margin + 25;
  setFontStyle(doc, 'normal', 10);
  doc.setTextColor(0, 0, 0);
  
  if (content.personalInfo.email) {
    doc.text(`Email: ${content.personalInfo.email}`, margin, contactY);
    contactY += 5;
  }
  
  if (content.personalInfo.phone) {
    doc.text(`Phone: ${content.personalInfo.phone}`, margin, contactY);
    contactY += 5;
  }
  
  if (content.personalInfo.location) {
    doc.text(`Location: ${content.personalInfo.location}`, margin, contactY);
    contactY += 5;
  }
  
  if (content.personalInfo.website) {
    doc.text(`Website: ${content.personalInfo.website}`, margin, contactY);
    contactY += 5;
  }
  
  // Divider
  contactY += 5;
  doc.setDrawColor(style.accentColor);
  doc.setLineWidth(0.5);
  doc.line(margin, contactY, pageWidth - margin, contactY);
  
  // Summary
  if (content.personalInfo.summary) {
    contactY += 10;
    setFontStyle(doc, 'bold', 14);
    doc.setTextColor(style.headerColor);
    doc.text('Summary', margin, contactY);
    
    contactY += 7;
    setFontStyle(doc, 'normal', 10);
    doc.setTextColor(0, 0, 0);
    
    const summaryLines = doc.splitTextToSize(
      content.personalInfo.summary,
      pageWidth - (2 * margin)
    );
    
    doc.text(summaryLines, margin, contactY);
    contactY += (summaryLines.length * 5) + 5;
  }
  
  // Experience section
  if (content.experience && content.experience.length > 0) {
    setFontStyle(doc, 'bold', 14);
    doc.setTextColor(style.headerColor);
    doc.text('Experience', margin, contactY);
    contactY += 7;
    
    // Loop through each experience
    for (const exp of content.experience) {
      // Check if we need to add a new page
      if (contactY > pageHeight - margin) {
        doc.addPage();
        contactY = margin + 10;
      }
      
      setFontStyle(doc, 'bold', 12);
      doc.setTextColor(0, 0, 0);
      doc.text(exp.title || 'Position', margin, contactY);
      
      setFontStyle(doc, 'normal', 11);
      doc.text(exp.company || 'Company', margin, contactY + 5);
      
      // Date range
      let dateText = '';
      if (exp.startDate) {
        dateText += exp.startDate;
        if (exp.current) {
          dateText += ' - Present';
        } else if (exp.endDate) {
          dateText += ` - ${exp.endDate}`;
        }
      }
      
      if (dateText) {
        const dateWidth = doc.getTextWidth(dateText);
        doc.text(dateText, pageWidth - margin - dateWidth, contactY);
      }
      
      // Location
      if (exp.location) {
        setFontStyle(doc, 'italic', 10);
        doc.text(exp.location, margin, contactY + 10);
        contactY += 15;
      } else {
        contactY += 10;
      }
      
      // Description
      if (exp.description) {
        setFontStyle(doc, 'normal', 10);
        const descLines = doc.splitTextToSize(
          exp.description,
          pageWidth - (2 * margin)
        );
        doc.text(descLines, margin, contactY);
        contactY += (descLines.length * 5) + 3;
      }
      
      // Bullet points
      if (exp.highlights && exp.highlights.length > 0) {
        setFontStyle(doc, 'normal', 10);
        
        for (const highlight of exp.highlights) {
          // Check if we need to add a new page
          if (contactY > pageHeight - margin) {
            doc.addPage();
            contactY = margin + 10;
          }
          
          const bulletLines = doc.splitTextToSize(
            `• ${highlight}`,
            pageWidth - (2 * margin) - 2
          );
          
          doc.text(bulletLines, margin + 2, contactY);
          contactY += (bulletLines.length * 5) + 2;
        }
      }
      
      contactY += 5;
    }
  }
  
  // Education section
  if (content.education && content.education.length > 0) {
    // Check if we need to add a new page
    if (contactY > pageHeight - 40) {
      doc.addPage();
      contactY = margin + 10;
    }
    
    setFontStyle(doc, 'bold', 14);
    doc.setTextColor(style.headerColor);
    doc.text('Education', margin, contactY);
    contactY += 7;
    
    // Loop through each education
    for (const edu of content.education) {
      setFontStyle(doc, 'bold', 12);
      doc.setTextColor(0, 0, 0);
      doc.text(edu.institution || 'Institution', margin, contactY);
      
      let degreeText = '';
      if (edu.degree) {
        degreeText = edu.degree;
        if (edu.field) {
          degreeText += ` in ${edu.field}`;
        }
      }
      
      if (degreeText) {
        setFontStyle(doc, 'normal', 11);
        doc.text(degreeText, margin, contactY + 5);
      }
      
      // Date range
      let dateText = '';
      if (edu.startDate) {
        dateText += edu.startDate;
        if (edu.current) {
          dateText += ' - Present';
        } else if (edu.endDate) {
          dateText += ` - ${edu.endDate}`;
        }
      }
      
      if (dateText) {
        const dateWidth = doc.getTextWidth(dateText);
        doc.text(dateText, pageWidth - margin - dateWidth, contactY);
      }
      
      // Location
      if (edu.location) {
        setFontStyle(doc, 'italic', 10);
        doc.text(edu.location, margin, contactY + 10);
        contactY += 15;
      } else {
        contactY += 10;
      }
      
      // Description
      if (edu.description) {
        setFontStyle(doc, 'normal', 10);
        const descLines = doc.splitTextToSize(
          edu.description,
          pageWidth - (2 * margin)
        );
        doc.text(descLines, margin, contactY);
        contactY += (descLines.length * 5) + 5;
      } else {
        contactY += 5;
      }
    }
  }
  
  // Skills section
  if (content.skills && content.skills.length > 0) {
    // Check if we need to add a new page
    if (contactY > pageHeight - 40) {
      doc.addPage();
      contactY = margin + 10;
    }
    
    setFontStyle(doc, 'bold', 14);
    doc.setTextColor(style.headerColor);
    doc.text('Skills', margin, contactY);
    contactY += 7;
    
    setFontStyle(doc, 'normal', 10);
    doc.setTextColor(0, 0, 0);
    
    // Organize skills into columns
    const skillNames = content.skills
      .map(skill => skill.name)
      .filter(name => name && name.trim() !== '');
    
    if (skillNames.length > 0) {
      const skillsPerRow = 3;
      const skillWidth = (pageWidth - (2 * margin)) / skillsPerRow;
      
      for (let i = 0; i < skillNames.length; i += skillsPerRow) {
        const rowSkills = skillNames.slice(i, i + skillsPerRow);
        
        for (let j = 0; j < rowSkills.length; j++) {
          doc.text(rowSkills[j], margin + (j * skillWidth), contactY);
        }
        
        contactY += 5;
      }
    }
  }
  
  // Record a download
  try {
    await apiRequest("POST", `/api/resumes/${resume.id}/download`);
  } catch (error) {
    console.error("Error recording download:", error);
  }
  
  // Return the PDF as a data URL
  return doc.output('datauristring');
};
