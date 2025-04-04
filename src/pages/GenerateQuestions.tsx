
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Download, Loader2 } from "lucide-react";

interface QuestionConfig {
  questionId: string;
  level: string;
  marks: number;
  includeC: boolean;
  co?: number; // Only for semester end exams
}

const GenerateQuestions = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [generatedQuestions, setGeneratedQuestions] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [examData, setExamData] = useState<{
    examConfig: { examType: string; semester: string; course: string };
    questionConfigs: QuestionConfig[];
    numQuestions: number;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    // Get data passed from the setup page
    const state = location.state as {
      examConfig: { examType: string; semester: string; course: string };
      questionConfigs: QuestionConfig[];
      numQuestions: number;
    } | null;
    
    if (!state) {
      toast({
        title: "Error",
        description: "No exam configuration provided",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }
    
    setExamData(state);
    
    // Auto-generate questions when the component loads
    generateQuestionsWithAI(state);
  }, [isAuthenticated, location.state, navigate, toast]);

  const generateQuestionsWithAI = async (data: {
    examConfig: { examType: string; semester: string; course: string };
    questionConfigs: QuestionConfig[];
    numQuestions: number;
  }) => {
    setIsGenerating(true);
    
    try {
      // This is a simulated AI response - in a real application, you would call your ML service here
      const mockAIResponse = simulateAIQuestionGeneration(data);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setGeneratedQuestions(mockAIResponse);
      
      toast({
        title: "Questions Generated",
        description: "AI has successfully generated questions based on your configuration",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "There was an error generating questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const simulateAIQuestionGeneration = (data: {
    examConfig: { examType: string; semester: string; course: string };
    questionConfigs: QuestionConfig[];
    numQuestions: number;
  }) => {
    const { examConfig, questionConfigs } = data;
    
    // Get course name from course code
    const courseMap: Record<string, string> = {
      "ML": "Machine Learning",
      "ACN": "Advanced Computer Networks",
      "DCN": "Data Communication Networks", 
      "DL": "Deep Learning",
      "DS": "Data Structures",
      "DBMS": "Database Management Systems",
      "AI": "Artificial Intelligence",
      "OS": "Operating Systems"
    };
    
    const courseName = courseMap[examConfig.course] || examConfig.course;
    
    let questionPaper = "";
    
    // Add header
    questionPaper += `${examConfig.examType === "CIE" ? "CONTINUOUS INTERNAL EVALUATION" : "SEMESTER END EXAMINATION"}\n`;
    questionPaper += `SEMESTER: ${examConfig.semester}\n`;
    questionPaper += `COURSE: ${courseName} (${examConfig.course})\n\n`;
    
    if (examConfig.examType === "CIE") {
      // For CIE, organize by sections (1, 2, 3)
      questionPaper += "Answer all questions. Each section carries 15 marks.\n\n";
      
      const sections = [1, 2, 3];
      
      for (const section of sections) {
        questionPaper += `SECTION ${section}:\n\n`;
        
        // Get questions for this section
        const sectionQuestions = questionConfigs.filter(q => q.questionId.startsWith(section.toString()));
        
        // Add each question part
        for (const question of sectionQuestions) {
          // Skip 'c' parts that are not included
          if (question.questionId.endsWith('c') && !question.includeC) {
            continue;
          }
          
          const questionPart = question.questionId[1]; // 'a', 'b', or 'c'
          questionPaper += `${section}${questionPart.toUpperCase()}. `;
          
          // Generate mock question based on difficulty and marks
          questionPaper += generateMockQuestion(
            examConfig.course, 
            question.level, 
            question.marks,
            null // No specific CO for CIE
          );
          
          questionPaper += ` [${question.marks} Marks]\n\n`;
        }
        
        questionPaper += "\n";
      }
    } else {
      // For Semester End, organize by Course Outcomes (COs 1-5)
      questionPaper += "Answer one full question from each module. Each module carries 20 marks.\n\n";
      
      const cos = [1, 2, 3, 4, 5];
      
      for (const co of cos) {
        questionPaper += `MODULE ${co} (CO${co}):\n\n`;
        
        // Each CO has 2 question sets (e.g., questions 1 and 2 for CO1)
        for (let setIdx = 1; setIdx <= 2; setIdx++) {
          const questionNum = (co - 1) * 2 + setIdx;
          
          // Get questions for this set
          const questionSet = questionConfigs.filter(q => parseInt(q.questionId) === questionNum);
          
          questionPaper += `Question ${questionNum}:\n`;
          
          // Add each question part
          for (const question of questionSet) {
            // Skip 'c' parts that are not included
            if (question.questionId.endsWith('c') && !question.includeC) {
              continue;
            }
            
            const questionPart = question.questionId.slice(-1); // 'a', 'b', or 'c'
            questionPaper += `${questionNum}${questionPart.toUpperCase()}. `;
            
            // Generate mock question based on difficulty and marks
            questionPaper += generateMockQuestion(
              examConfig.course, 
              question.level, 
              question.marks,
              co
            );
            
            questionPaper += ` [${question.marks} Marks]\n\n`;
          }
          
          questionPaper += "\n";
        }
      }
    }
    
    return questionPaper;
  };

  const generateMockQuestion = (course: string, level: string, marks: number, co: number | null) => {
    // This function would be replaced by actual AI generation in a real implementation
    // Here we're just simulating different types of questions based on the parameters
    
    const courseTopics: Record<string, string[]> = {
      "ML": [
        "linear regression", "logistic regression", "decision trees", 
        "random forests", "support vector machines", "neural networks", 
        "clustering algorithms", "dimensionality reduction", "ensemble methods"
      ],
      "ACN": [
        "TCP/IP protocol", "routing algorithms", "software-defined networking", 
        "network security", "wireless networks", "cloud networking", 
        "quality of service", "network virtualization"
      ],
      "DBMS": [
        "normalization", "SQL queries", "transaction management", 
        "concurrency control", "indexing", "data warehousing", 
        "NoSQL databases", "database security"
      ],
      "DS": [
        "arrays", "linked lists", "stacks", "queues", 
        "trees", "graphs", "sorting algorithms", "searching algorithms", 
        "hashing", "dynamic programming"
      ]
    };
    
    // Default topics if course not found
    const topics = courseTopics[course] || [
      "programming concepts", "data analysis", "system design", 
      "software development", "computer architecture", "algorithms"
    ];
    
    // Randomize topic selection based on seed values
    const seed = level.length + marks + (co || 0);
    const topic = topics[seed % topics.length];
    
    // Question templates based on difficulty
    const questionTemplates: Record<string, string[]> = {
      "easy": [
        `Define and explain ${topic}.`,
        `List the key characteristics of ${topic}.`,
        `Draw a diagram to illustrate ${topic}.`,
        `What are the basic components of ${topic}?`,
        `Compare and contrast ${topic} with another related concept.`
      ],
      "medium": [
        `Explain the working principle of ${topic} with a suitable example.`,
        `Analyze the advantages and disadvantages of ${topic} in practical applications.`,
        `Illustrate how ${topic} is implemented in real-world scenarios.`,
        `Describe the algorithm behind ${topic} with its time complexity.`,
        `Explain the relationship between ${topic} and other related concepts.`
      ],
      "hard": [
        `Design a system that implements ${topic} to solve a complex problem in industry.`,
        `Critically evaluate the performance of ${topic} under different constraints and optimization criteria.`,
        `Propose and justify improvements to existing ${topic} implementations to enhance efficiency.`,
        `Develop a mathematical model for ${topic} and analyze its theoretical limitations.`,
        `Create a novel approach combining ${topic} with other techniques to address a challenging scenario.`
      ]
    };
    
    const templates = questionTemplates[level] || questionTemplates["medium"];
    const questionTemplate = templates[(seed + marks) % templates.length];
    
    return questionTemplate;
  };

  const handleDownload = () => {
    if (!generatedQuestions) return;
    
    const blob = new Blob([generatedQuestions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = 'generated_question_paper.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "Your question paper is being downloaded as a text file.",
    });
  };

  const handleRegenerateQuestions = () => {
    if (examData) {
      generateQuestionsWithAI(examData);
    }
  };

  const goBack = () => {
    const backRoute = examData?.examConfig.examType === "CIE" 
      ? "/cie-exam-setup" 
      : "/semester-exam-setup";
      
    navigate(backRoute, { state: examData?.examConfig });
  };

  if (!examData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center">
          <Button variant="ghost" size="sm" onClick={goBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Generated Question Paper</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Question Paper</span>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRegenerateQuestions}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Regenerate"
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDownload}
                    disabled={!generatedQuestions || isGenerating}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-lg font-medium">Generating questions...</p>
                  <p className="text-sm text-muted-foreground">
                    Our AI is creating a balanced question paper based on your specifications
                  </p>
                </div>
              ) : (
                <Textarea 
                  value={generatedQuestions} 
                  onChange={(e) => setGeneratedQuestions(e.target.value)}
                  className="font-mono min-h-[60vh] text-sm"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default GenerateQuestions;
