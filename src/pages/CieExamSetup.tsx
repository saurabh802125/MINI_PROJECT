import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import NetworkGridBackground from "@/components/NetworkGridBackground";

interface QuestionConfig {
  questionId: string;
  level: string;
  marks: number;
  includeC: boolean; // For c parts (1c, 2c, 3c)
}

const CieExamSetup = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [examConfig, setExamConfig] = useState<{
    examType: string;
    semester: string;
    course: string;
  } | null>(null);
  
  const [questionConfigs, setQuestionConfigs] = useState<QuestionConfig[]>([
    // Initialize with default values for questions 1a, 1b, 1c, 2a, 2b, 2c, 3a, 3b, 3c
    { questionId: "1a", level: "medium", marks: 5, includeC: false },
    { questionId: "1b", level: "medium", marks: 5, includeC: false },
    { questionId: "1c", level: "hard", marks: 5, includeC: true },
    { questionId: "2a", level: "medium", marks: 5, includeC: false },
    { questionId: "2b", level: "medium", marks: 5, includeC: false },
    { questionId: "2c", level: "hard", marks: 5, includeC: true },
    { questionId: "3a", level: "medium", marks: 5, includeC: false },
    { questionId: "3b", level: "medium", marks: 5, includeC: false },
    { questionId: "3c", level: "hard", marks: 5, includeC: true },
  ]);
  

  const [numQuestions, setNumQuestions] = useState<number>(5); // Default number of questions to generate

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    // Get data passed from the dashboard
    const state = location.state as { examType: string; semester: string; course: string } | null;
    console.log("Location state:", location.state);
    if (!state) {

      toast({
        title: "Error",
        description: "No exam configuration provided",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }
    
    setExamConfig(state);
  }, [isAuthenticated, location.state, navigate, toast]);

  const handleLevelChange = (questionId: string, level: string) => {
    setQuestionConfigs(prevConfigs => 
      prevConfigs.map(config => 
        config.questionId === questionId ? { ...config, level } : config
      )
    );
  };

  const handleMarksChange = (questionId: string, marks: number) => {
    setQuestionConfigs(prevConfigs => 
      prevConfigs.map(config => 
        config.questionId === questionId ? { ...config, marks } : config
      )
    );
  };

  const handleIncludeCChange = (questionId: string, includeC: boolean) => {
    if (questionId.endsWith('c')) {
      setQuestionConfigs(prevConfigs => 
        prevConfigs.map(config => 
          config.questionId === questionId ? { ...config, includeC } : config
        )
      );
    }
  };

  const handleSubmit = () => {
    // Validate total marks per section
    const sections = ["1", "2", "3"];
    
    for (const section of sections) {
      const sectionQuestions = questionConfigs.filter(q => q.questionId.startsWith(section));
      const sectionMarks = sectionQuestions.reduce((sum, q) => {
        // Only count marks for questions that will be included
        if (q.questionId.endsWith('c') && !q.includeC) {
          return sum;
        }
        return sum + q.marks;
      }, 0);
      
      // Each section should have a total of 15 marks (for CIE)
      if (sectionMarks !== 15) {
        toast({
          title: "Invalid marks distribution",
          description: `Section ${section} must have a total of 15 marks. Current total: ${sectionMarks}`,
          variant: "destructive",
        });
        return;
      }
    }
    
    // Navigate to question generation page with the configuration
    navigate("/generate-questions", {
      state: {
        examConfig,
        questionConfigs,
        numQuestions
      }
    });
  };

  const goBack = () => {
    navigate("/dashboard");
  };

  if (!examConfig) {
    return (
      <NetworkGridBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Loading...</div>
        </div>
      </NetworkGridBackground>
    );
  }

  // Group questions by section for easier rendering
  const sections = [
    questionConfigs.filter(q => q.questionId.startsWith('1')),
    questionConfigs.filter(q => q.questionId.startsWith('2')),
    questionConfigs.filter(q => q.questionId.startsWith('3')),
  ];

  return (
    <NetworkGridBackground>
      <div className="min-h-screen">
        <header className="bg-black/40 backdrop-blur-sm border-b border-cyan-500/20 shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center">
            <Button variant="ghost" size="sm" onClick={goBack} className="mr-4 text-cyan-100 hover:bg-cyan-900/30 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-white">CIE Exam Configuration</h1>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card className="mb-6 shadow-xl bg-black/40 backdrop-blur-sm border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-white">Exam Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-cyan-300">Exam Type</p>
                    <p className="mt-1 text-white">{examConfig.examType === "CIE" ? "CIE" : "Semester End"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cyan-300">Semester</p>
                    <p className="mt-1 text-white">{examConfig.semester}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cyan-300">Course</p>
                    <p className="mt-1 text-white">{examConfig.course}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-6 shadow-xl bg-black/40 backdrop-blur-sm border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-white">Question Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {sections.map((sectionQuestions, idx) => (
                    <div key={idx} className="border border-cyan-500/30 p-4 rounded-md bg-black/20">
                      <h3 className="text-lg font-medium mb-3 text-cyan-100">Section {idx + 1}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {sectionQuestions.map((question) => (
                          <div key={question.questionId} className="border border-cyan-500/20 p-3 rounded-md bg-black/30">
                            <p className="font-medium mb-2 text-white">Question {question.questionId.toUpperCase()}</p>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm text-cyan-200">Difficulty Level</label>
                                <Select
                                  value={question.level}
                                  onValueChange={(value) => handleLevelChange(question.questionId, value)}
                                >
                                  <SelectTrigger className="border-cyan-500/30 bg-black/50 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 text-white border-slate-700">
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <label className="text-sm text-cyan-200">Marks</label>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="15"
                                  value={question.marks} 
                                  onChange={(e) => handleMarksChange(question.questionId, parseInt(e.target.value) || 0)}
                                  className="bg-black/50 border-cyan-500/30 text-white"
                                />
                              </div>
                              
                              {question.questionId.endsWith('c') && (
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`include-${question.questionId}`}
                                    checked={question.includeC}
                                    onCheckedChange={(checked) => 
                                      handleIncludeCChange(question.questionId, checked as boolean)
                                    }
                                    className="border-white/50 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                                  />
                                  <label 
                                    htmlFor={`include-${question.questionId}`}
                                    className="text-sm cursor-pointer text-cyan-100"
                                  >
                                    Include {question.questionId.toUpperCase()}
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-6 shadow-xl bg-black/40 backdrop-blur-sm border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-white">Generation Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-cyan-200">Number of questions to generate per section</label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="20"
                    value={numQuestions} 
                    onChange={(e) => setNumQuestions(parseInt(e.target.value) || 1)}
                    className="bg-black/50 border-cyan-500/30 text-white"
                  />
                  <p className="text-sm text-cyan-200/70">
                    The AI will generate {numQuestions} question options for each section
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end mt-6">
              <Button onClick={handleSubmit} className="bg-cyan-600 hover:bg-cyan-500">
                Generate Question Paper
              </Button>
            </div>
          </div>
        </main>
      </div>
    </NetworkGridBackground>
  );
};

export default CieExamSetup;