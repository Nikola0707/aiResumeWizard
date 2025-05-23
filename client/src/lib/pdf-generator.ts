import { jsPDF } from "jspdf";
import { ResumeContent, ResumeTemplate, Resume } from "@shared/schema";
import { apiRequest } from "./queryClient";

// Helper function to set font styles
const setFontStyle = (
  doc: jsPDF,
  style: "normal" | "bold" | "italic",
  size: number
) => {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
};

// Helper function to add section title
const addSectionTitle = (
  doc: jsPDF,
  title: string,
  y: number,
  style: any,
  margin: number
) => {
  setFontStyle(doc, "bold", 14);
  doc.setTextColor(style.headerColor);
  doc.text(title, margin, y);
  return y + 7;
};

// Helper function to check and add new page if needed
const checkAndAddPage = (
  doc: jsPDF,
  currentY: number,
  margin: number,
  pageHeight: number
): number => {
  if (currentY > pageHeight - margin) {
    doc.addPage();
    return margin + 10;
  }
  return currentY;
};

// Templates have different styling configurations
const templateStyles: Record<
  ResumeTemplate,
  {
    headerColor: string;
    accentColor: string;
    bodyFont: string;
    headerFont: string;
    sectionSpacing: number;
    bulletSpacing: number;
    lineSpacing: number;
  }
> = {
  modern: {
    headerColor: "#3b82f6",
    accentColor: "#93c5fd",
    bodyFont: "helvetica",
    headerFont: "helvetica",
    sectionSpacing: 10,
    bulletSpacing: 5,
    lineSpacing: 5,
  },
  professional: {
    headerColor: "#1e40af",
    accentColor: "#60a5fa",
    bodyFont: "helvetica",
    headerFont: "helvetica",
    sectionSpacing: 12,
    bulletSpacing: 6,
    lineSpacing: 6,
  },
  creative: {
    headerColor: "#8b5cf6",
    accentColor: "#c4b5fd",
    bodyFont: "helvetica",
    headerFont: "helvetica",
    sectionSpacing: 8,
    bulletSpacing: 4,
    lineSpacing: 4,
  },
  simple: {
    headerColor: "#000000",
    accentColor: "#d1d5db",
    bodyFont: "helvetica",
    headerFont: "helvetica",
    sectionSpacing: 15,
    bulletSpacing: 7,
    lineSpacing: 7,
  },
  elegant: {
    headerColor: "#1f2937",
    accentColor: "#9ca3af",
    bodyFont: "helvetica",
    headerFont: "helvetica",
    sectionSpacing: 11,
    bulletSpacing: 5,
    lineSpacing: 5,
  },
};

// Function to generate a PDF from a resume
export const generateResumePDF = async (resume: Resume): Promise<string> => {
  try {
    const content = resume.content as ResumeContent;
    const template = resume.template as ResumeTemplate;

    // Create a new document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const style = templateStyles[template] || templateStyles.modern;

    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    let currentY = margin;

    // Header section
    setFontStyle(doc, "bold", 24);
    doc.setTextColor(style.headerColor);
    doc.text(
      content.personalInfo.fullName || "Full Name",
      margin,
      currentY + 10
    );

    setFontStyle(doc, "normal", 14);
    doc.text(
      content.personalInfo.professionalTitle || "Professional Title",
      margin,
      currentY + 18
    );

    // Contact information
    currentY += 25;
    setFontStyle(doc, "normal", 10);
    doc.setTextColor(0, 0, 0);

    const contactInfo = [
      { icon: "📧", text: content.personalInfo.email },
      { icon: "📱", text: content.personalInfo.phone },
      { icon: "📍", text: content.personalInfo.location },
      { icon: "🌐", text: content.personalInfo.website },
    ].filter((info) => info.text);

    contactInfo.forEach((info, index) => {
      doc.text(
        `${info.icon} ${info.text}`,
        margin + (index * (pageWidth - 2 * margin)) / contactInfo.length,
        currentY
      );
    });

    // Divider
    currentY += 10;
    doc.setDrawColor(style.accentColor);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);

    // Summary
    if (content.personalInfo.summary) {
      currentY = checkAndAddPage(
        doc,
        currentY + style.sectionSpacing,
        margin,
        pageHeight
      );
      currentY = addSectionTitle(doc, "Summary", currentY, style, margin);

      setFontStyle(doc, "normal", 10);
      doc.setTextColor(0, 0, 0);

      const summaryLines = doc.splitTextToSize(
        content.personalInfo.summary,
        pageWidth - 2 * margin
      );

      doc.text(summaryLines, margin, currentY);
      currentY +=
        summaryLines.length * style.lineSpacing + style.sectionSpacing;
    }

    // Experience section
    if (content.experience && content.experience.length > 0) {
      currentY = checkAndAddPage(doc, currentY, margin, pageHeight);
      currentY = addSectionTitle(doc, "Experience", currentY, style, margin);

      for (const exp of content.experience) {
        currentY = checkAndAddPage(doc, currentY, margin, pageHeight);

        // Title and Company
        setFontStyle(doc, "bold", 12);
        doc.setTextColor(0, 0, 0);
        doc.text(exp.title || "Position", margin, currentY);

        setFontStyle(doc, "normal", 11);
        doc.text(exp.company || "Company", margin, currentY + 5);

        // Date range
        let dateText = "";
        if (exp.startDate) {
          dateText += exp.startDate;
          if (exp.current) {
            dateText += " - Present";
          } else if (exp.endDate) {
            dateText += ` - ${exp.endDate}`;
          }
        }

        if (dateText) {
          const dateWidth = doc.getTextWidth(dateText);
          doc.text(dateText, pageWidth - margin - dateWidth, currentY);
        }

        // Location
        if (exp.location) {
          setFontStyle(doc, "italic", 10);
          doc.text(exp.location, margin, currentY + 10);
          currentY += 15;
        } else {
          currentY += 10;
        }

        // Description
        if (exp.description) {
          setFontStyle(doc, "normal", 10);
          const descLines = doc.splitTextToSize(
            exp.description,
            pageWidth - 2 * margin
          );
          doc.text(descLines, margin, currentY);
          currentY += descLines.length * style.lineSpacing + 3;
        }

        // Bullet points
        if (exp.highlights && exp.highlights.length > 0) {
          setFontStyle(doc, "normal", 10);

          for (const highlight of exp.highlights) {
            currentY = checkAndAddPage(doc, currentY, margin, pageHeight);

            const bulletLines = doc.splitTextToSize(
              `• ${highlight}`,
              pageWidth - 2 * margin - 2
            );

            doc.text(bulletLines, margin + 2, currentY);
            currentY +=
              bulletLines.length * style.lineSpacing + style.bulletSpacing;
          }
        }

        currentY += style.sectionSpacing;
      }
    }

    // Education section
    if (content.education && content.education.length > 0) {
      currentY = checkAndAddPage(doc, currentY, margin, pageHeight);
      currentY = addSectionTitle(doc, "Education", currentY, style, margin);

      for (const edu of content.education) {
        currentY = checkAndAddPage(doc, currentY, margin, pageHeight);

        setFontStyle(doc, "bold", 12);
        doc.setTextColor(0, 0, 0);
        doc.text(edu.institution || "Institution", margin, currentY);

        let degreeText = "";
        if (edu.degree) {
          degreeText = edu.degree;
          if (edu.field) {
            degreeText += ` in ${edu.field}`;
          }
        }

        if (degreeText) {
          setFontStyle(doc, "normal", 11);
          doc.text(degreeText, margin, currentY + 5);
        }

        // Date range
        let dateText = "";
        if (edu.startDate) {
          dateText += edu.startDate;
          if (edu.current) {
            dateText += " - Present";
          } else if (edu.endDate) {
            dateText += ` - ${edu.endDate}`;
          }
        }

        if (dateText) {
          const dateWidth = doc.getTextWidth(dateText);
          doc.text(dateText, pageWidth - margin - dateWidth, currentY);
        }

        // Location
        if (edu.location) {
          setFontStyle(doc, "italic", 10);
          doc.text(edu.location, margin, currentY + 10);
          currentY += 15;
        } else {
          currentY += 10;
        }

        // Description
        if (edu.description) {
          setFontStyle(doc, "normal", 10);
          const descLines = doc.splitTextToSize(
            edu.description,
            pageWidth - 2 * margin
          );
          doc.text(descLines, margin, currentY);
          currentY += descLines.length * style.lineSpacing + 3;
        }

        currentY += style.sectionSpacing;
      }
    }

    // Skills section
    if (content.skills && content.skills.length > 0) {
      currentY = checkAndAddPage(doc, currentY, margin, pageHeight);
      currentY = addSectionTitle(doc, "Skills", currentY, style, margin);

      setFontStyle(doc, "normal", 10);
      doc.setTextColor(0, 0, 0);

      // Group skills by category if available
      const skillsByCategory = content.skills.reduce((acc, skill) => {
        const category = skill.category || "Other";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(skill.name);
        return acc;
      }, {} as Record<string, string[]>);

      for (const [category, skills] of Object.entries(skillsByCategory)) {
        currentY = checkAndAddPage(doc, currentY, margin, pageHeight);

        if (category !== "Other") {
          setFontStyle(doc, "bold", 11);
          doc.text(category, margin, currentY);
          currentY += 5;
        }

        setFontStyle(doc, "normal", 10);
        const skillsText = skills.join(" • ");
        const skillsLines = doc.splitTextToSize(
          skillsText,
          pageWidth - 2 * margin
        );

        doc.text(skillsLines, margin, currentY);
        currentY +=
          skillsLines.length * style.lineSpacing + style.sectionSpacing;
      }
    }

    // Add page numbers
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      setFontStyle(doc, "normal", 8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - margin - 20,
        pageHeight - margin
      );
    }

    // Return the PDF as a data URI
    return doc.output("datauristring");
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF. Please try again.");
  }
};
