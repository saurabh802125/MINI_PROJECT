
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { coursesAPI, examsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, BookOpen, AlarmClock, FileText } from "lucide-react";

interface Course {
  _id: string;
  name: string;
  code: string;
}

interface Exam {
  _id: string;
  examType: string;
  semester: string;
  course: Course;
  createdAt: string;
}

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch courses
        const coursesResponse = await coursesAPI.getAllCourses();
        setCourses(coursesResponse.data);

        // Fetch exams
        const examsResponse = await examsAPI.getEducatorExams();
        setExams(examsResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load your data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-500">Welcome back, {currentUser?.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="mt-4 md:mt-0">
            Logout
          </Button>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                My Courses
              </CardTitle>
              <CardDescription>Courses you're teaching</CardDescription>
            </CardHeader>
            <CardContent>
              {currentUser?.courses?.length > 0 ? (
                <ul className="space-y-2">
                  {currentUser.courses.map((courseId: string) => {
                    const course = courses.find(c => c._id === courseId);
                    return (
                      <li key={courseId} className="p-2 bg-gray-100 rounded-md">
                        {course ? `${course.name} (${course.code})` : 'Unknown course'}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-gray-500">No courses assigned yet</p>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => navigate("/semester-exam-setup")}>
                SEE EXAM
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlarmClock className="mr-2 h-5 w-5" />
                Recent Exams
              </CardTitle>
              <CardDescription>Your recently created exams</CardDescription>
            </CardHeader>
            <CardContent>
              {exams.length > 0 ? (
                <ul className="space-y-2">
                  {exams.slice(0, 3).map((exam) => (
                    <li key={exam._id} className="p-2 bg-gray-100 rounded-md">
                      <div className="font-medium">{exam.examType} - {exam.course.code}</div>
                      <div className="text-sm text-gray-500">Semester: {exam.semester}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No exams created yet</p>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => navigate("/cie-exam-setup")}>
                CIE Exam
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Generate Questions
              </CardTitle>
              <CardDescription>Use AI to create exam questions</CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <p className="text-gray-600">
                Generate exam questions for your courses using our AI-powered tool.
                Questions are tailored to your course material and exam requirements.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate("/generate-questions")}>
                Generate Questions
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>Your educator profile details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                    <p>{currentUser?.name || 'Not available'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p>{currentUser?.email || 'Not available'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Department</h3>
                    <p>{currentUser?.department || 'Not available'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Semester</h3>
                    <p>{currentUser?.semester || 'Not available'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
