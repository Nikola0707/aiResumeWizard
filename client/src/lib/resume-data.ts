import { 
  type ResumeContent, 
  type PersonalInfo, 
  type ExperienceItem, 
  type EducationItem, 
  type SkillItem,
  type Resume,
  type ResumeTemplate
} from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

export const defaultPersonalInfo: PersonalInfo = {
  fullName: "",
  professionalTitle: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  summary: "",
};

export const createEmptyExperienceItem = (): ExperienceItem => ({
  id: uuidv4(),
  title: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
  highlights: [],
});

export const createEmptyEducationItem = (): EducationItem => ({
  id: uuidv4(),
  institution: "",
  degree: "",
  field: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
});

export const createEmptySkillItem = (): SkillItem => ({
  id: uuidv4(),
  name: "",
  level: 3,
});

export const createEmptyResumeContent = (): ResumeContent => ({
  personalInfo: defaultPersonalInfo,
  experience: [createEmptyExperienceItem()],
  education: [createEmptyEducationItem()],
  skills: [createEmptySkillItem()],
});

export const resumeTemplates: Record<ResumeTemplate, { name: string; description: string }> = {
  modern: {
    name: "Modern",
    description: "Clean and contemporary design with accent colors"
  },
  professional: {
    name: "Professional",
    description: "Traditional layout ideal for corporate environments"
  },
  creative: {
    name: "Creative",
    description: "Bold design for creative industries"
  },
  simple: {
    name: "Simple",
    description: "Minimalist design with focus on content"
  },
  elegant: {
    name: "Elegant",
    description: "Sophisticated design with subtle styling"
  }
};

export function convertResumeToText(resume: Resume): string {
  const content = resume.content as ResumeContent;
  let text = '';
  
  // Personal Info
  const { personalInfo } = content;
  text += `${personalInfo.fullName || 'Name'}\n`;
  text += `${personalInfo.professionalTitle || 'Title'}\n`;
  
  if (personalInfo.email) text += `Email: ${personalInfo.email}\n`;
  if (personalInfo.phone) text += `Phone: ${personalInfo.phone}\n`;
  if (personalInfo.location) text += `Location: ${personalInfo.location}\n`;
  if (personalInfo.website) text += `Website: ${personalInfo.website}\n`;
  
  if (personalInfo.summary) {
    text += '\nSUMMARY\n';
    text += `${personalInfo.summary}\n`;
  }
  
  // Experience
  if (content.experience && content.experience.length > 0) {
    text += '\nEXPERIENCE\n';
    content.experience.forEach(exp => {
      text += `${exp.title || 'Position'} at ${exp.company || 'Company'}`;
      if (exp.location) text += `, ${exp.location}`;
      
      const dateRange = [];
      if (exp.startDate) dateRange.push(exp.startDate);
      if (exp.current) {
        dateRange.push('Present');
      } else if (exp.endDate) {
        dateRange.push(exp.endDate);
      }
      
      if (dateRange.length > 0) {
        text += ` | ${dateRange.join(' - ')}`;
      }
      
      text += '\n';
      
      if (exp.description) text += `${exp.description}\n`;
      
      if (exp.highlights && exp.highlights.length > 0) {
        exp.highlights.forEach(highlight => {
          text += `• ${highlight}\n`;
        });
      }
      
      text += '\n';
    });
  }
  
  // Education
  if (content.education && content.education.length > 0) {
    text += '\nEDUCATION\n';
    content.education.forEach(edu => {
      text += `${edu.institution || 'Institution'}`;
      
      if (edu.degree) {
        text += ` | ${edu.degree}`;
        if (edu.field) text += ` in ${edu.field}`;
      }
      
      if (edu.location) text += ` | ${edu.location}`;
      
      const dateRange = [];
      if (edu.startDate) dateRange.push(edu.startDate);
      if (edu.current) {
        dateRange.push('Present');
      } else if (edu.endDate) {
        dateRange.push(edu.endDate);
      }
      
      if (dateRange.length > 0) {
        text += ` | ${dateRange.join(' - ')}`;
      }
      
      text += '\n';
      
      if (edu.description) text += `${edu.description}\n`;
      
      text += '\n';
    });
  }
  
  // Skills
  if (content.skills && content.skills.length > 0) {
    text += '\nSKILLS\n';
    const skillNames = content.skills.map(skill => skill.name).filter(Boolean);
    text += skillNames.join(', ');
    text += '\n';
  }
  
  return text;
}
