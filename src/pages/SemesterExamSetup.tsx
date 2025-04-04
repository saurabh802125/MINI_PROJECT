
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

interface QuestionConfig {
  questionId: string;
  level: string;
  marks: number;
  includeC: boolean; // For c parts
  co: number; // Course Outcome (1-5)
}

const SemesterExamSetup = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [examConfig, setExamConfig] = useState<{
    examType: string;
    semester: string;
    course: string;
  } | null>(null);
  
  const [questionConfigs, setQuestionConfigs] = useState<QuestionConfig[]>([]);
  const [numQuestions, setNumQuestions] = useState<number>(5); // Default number of questions to generate

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    // Get data passed from the dashboard
    const state = location.state as { examType: string; semester: string; course: string } | null;
    
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
    
    // Initialize question configuration for semester-end exam (10 sections, 3 questions each - a, b, c)
    const initialConfigs: QuestionConfig[] = [];
    for (let questionNum = 1; questionNum <= 10; questionNum++) {
      const co = Math.ceil(questionNum / 2); // Maps questions 1-2 to CO1, 3-4 to CO2, etc.
      
      ['a', 'b', 'c'].forEach(part => {
        initialConfigs.push({
          questionId: `${questionNum}${part}`,
          level: part === 'c' ? 'hard' : 'medium',
          marks: part === 'a' ? 5 : part === 'b' ? 7 : 8, // a: 5 marks, b: 7 marks, c: 8 marks
          includeC: part === 'c' ? false : true, // c parts are optional by default
          co
        });
      });
    }
    
    setQuestionConfigs(initialConfigs);
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
    // Validate total marks per course outcome (CO)
    const cos = [1, 2, 3, 4, 5];
    
    for (const co of cos) {
      // Each CO has 2 sets of questions (e.g., CO1 has questions 1 and 2)
      const coQuestionSets = [
        questionConfigs.filter(q => q.co === co && parseInt(q.questionId) === (co * 2) - 1), // Odd numbered questions
        questionConfigs.filter(q => q.co === co && parseInt(q.questionId) === co * 2) // Even numbered questions
      ];
      
      // Check if both sets have valid marks (20 marks per set)
      for (const [idx, questionSet] of coQuestionSets.entries()) {
        const setMarks = questionSet.reduce((sum, q) => {
          // Only count marks for questions that will be included
          if (q.questionId.endsWith('c') && !q.includeC) {
            return sum;
          }
          return sum + q.marks;
        }, 0);
        
        // Each set should have a total of 20 marks
        if (setMarks !== 20) {
          const questionNum = idx === 0 ? (co * 2) - 1 : co * 2;
          toast({
            title: "Invalid marks distribution",
            description: `Question ${questionNum} (CO${co}) must have a total of 20 marks. Current total: ${setMarks}`,
            variant: "destructive",
          });
          return;
        }
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
    return <div>Loading...</div>;
  }

  // Group questions by CO for easier rendering
  const courseOutcomes = [1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center">
          <Button variant="ghost" size="sm" onClick={goBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Semester End Exam Configuration</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Exam Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Exam Type</p>
                  <p className="mt-1">{examConfig.examType === "CIE" ? "CIE" : "Semester End"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Semester</p>
                  <p className="mt-1">{examConfig.semester}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Course</p>
                  <p className="mt-1">{examConfig.course}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            {courseOutcomes.map(co => (
              <Card key={co} className="mb-6">
                <CardHeader>
                  <CardTitle>Course Outcome {co} (CO{co})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Each CO has 2 question sets (e.g., questions 1 and 2 for CO1) */}
                    {[1, 2].map(setIdx => {
                      const questionNum = (co - 1) * 2 + setIdx;
                      const questionSet = questionConfigs.filter(q => parseInt(q.questionId) === questionNum);
                      
                      return (
                        <div key={questionNum} className="border p-4 rounded-md">
                          <h3 className="text-lg font-medium mb-3">Question {questionNum}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {questionSet.map((question) => (
                              <div key={question.questionId} className="border p-3 rounded-md">
                                <p className="font-medium mb-2">Part {question.questionId.slice(-1).toUpperCase()}</p>
                                
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-sm">Difficulty Level</label>
                                    <Select
                                      value={question.level}
                                      onValueChange={(value) => handleLevelChange(question.questionId, value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm">Marks</label>
                                    <Input 
                                      type="number" 
                                      min="1" 
                                      max="20"
                                      value={question.marks} 
                                      onChange={(e) => handleMarksChange(question.questionId, parseInt(e.target.value) || 0)}
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
                                      />
                                      <label 
                                        htmlFor={`include-${question.questionId}`}
                                        className="text-sm cursor-pointer"
                                      >
                                        Include part C
                                      </label>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Generation Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of questions to generate per section</label>
                <Input 
                  type="number" 
                  min="1" 
                  max="20"
                  value={numQuestions} 
                  onChange={(e) => setNumQuestions(parseInt(e.target.value) || 1)}
                />
                <p className="text-sm text-gray-500">
                  The AI will generate {numQuestions} question options for each section
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end mt-6">
            <Button onClick={handleSubmit}>
              Generate Question Paper
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SemesterExamSetup;
