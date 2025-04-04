import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { coursesAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { ArrowRight, Loader2 } from "lucide-react";

interface Course {
  _id: string;
  name: string;
  code: string;
}

const ExamTypeSelection = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [examType, setExamType] = useState<string>("");
  const [semester, setSemester] = useState<string>(currentUser?.semester || "");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await coursesAPI.getAllCourses();
      
      // Filter courses based on currentUser's courses if available
      let availableCourses = response.data;
      if (currentUser?.courses && currentUser.courses.length > 0) {
        availableCourses = response.data.filter((course: Course) => 
          currentUser.courses.includes(course._id)
        );
      }
      
      setCourses(availableCourses);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load courses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch courses when component mounts
  useEffect(() => {
    fetchCourses();
  }, []);

  const handleContinue = () => {
    if (!examType) {
      toast({
        title: "Missing Selection",
        description: "Please select an exam type to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!semester) {
      toast({
        title: "Missing Selection",
        description: "Please select a semester to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCourse) {
      toast({
        title: "Missing Selection",
        description: "Please select a course to continue.",
        variant: "destructive",
      });
      return;
    }

    // Determine which route to navigate to
    const route = examType === "CIE" ? "/cie-exam-setup" : "/semester-exam-setup";
    
    // Navigate with the selected configuration
    navigate(route, {
      state: {
        examType,
        semester,
        course: selectedCourse,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="w-full shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Select Exam Type</CardTitle>
            <CardDescription>Configure the type of exam you want to create</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Exam Type</label>
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CIE">Continuous Internal Evaluation (CIE)</SelectItem>
                  <SelectItem value="SEE">Semester End Examination (SEE)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Semester</label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semester 1</SelectItem>
                  <SelectItem value="2">Semester 2</SelectItem>
                  <SelectItem value="3">Semester 3</SelectItem>
                  <SelectItem value="4">Semester 4</SelectItem>
                  <SelectItem value="5">Semester 5</SelectItem>
                  <SelectItem value="6">Semester 6</SelectItem>
                  <SelectItem value="7">Semester 7</SelectItem>
                  <SelectItem value="8">Semester 8</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Course</label>
              {isLoading ? (
                <div className="flex items-center space-x-2 p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading courses...</span>
                </div>
              ) : (
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.length > 0 ? (
                      courses.map((course) => (
                        <SelectItem key={course._id} value={course.code}>
                          {course.name} ({course.code})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No courses available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end">
            <Button onClick={handleContinue} disabled={!examType || !semester || !selectedCourse}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ExamTypeSelection;