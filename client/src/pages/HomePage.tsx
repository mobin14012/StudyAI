import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useAuthStore } from "@/stores/auth-store";
import {
  Upload,
  Brain,
  TrendingUp,
  Sparkles,
  BarChart3,
  Target,
  ListChecks,
  Clock,
  Users,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Zap,
  GraduationCap,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Navbar Component
function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">StudyAI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("features")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How it Works
            </button>
            <button
              onClick={() => scrollToSection("benefits")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Benefits
            </button>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button onClick={() => navigate("/")}>
                Dashboard
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button onClick={() => navigate("/register")}>
                  Get Started
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection("features")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                How it Works
              </button>
              <button
                onClick={() => scrollToSection("benefits")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Benefits
              </button>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {isAuthenticated ? (
                  <Button onClick={() => navigate("/")}>
                    Dashboard
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => navigate("/login")}>
                      Login
                    </Button>
                    <Button onClick={() => navigate("/register")}>
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Hero Section
function HeroSection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              AI-Powered Learning Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Study Smarter with{" "}
              <span className="text-primary">AI-Powered</span> Personalized
              Practice
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
              Upload your study material, practice with AI-generated questions,
              and improve faster with adaptive learning that focuses on your
              weak areas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                className="h-12 px-8 text-base"
                onClick={() => navigate(isAuthenticated ? "/" : "/register")}
              >
                {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base"
                onClick={() => scrollToSection("how-it-works")}
              >
                See How It Works
              </Button>
            </div>
            {/* Trust indicators */}
            <div className="flex items-center gap-6 mt-10 justify-center lg:justify-start text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Free to start
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                No credit card required
              </div>
            </div>
          </div>

          {/* Right Content - Mock UI Preview */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Main card - Question Interface Mock */}
              <Card className="shadow-2xl border-2">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Brain className="h-4 w-4" />
                      AI Generated Question
                    </div>
                    <p className="font-medium">
                      What is the primary function of mitochondria in a cell?
                    </p>
                    <div className="space-y-2">
                      {[
                        "Energy production (ATP synthesis)",
                        "Protein synthesis",
                        "Cell division",
                        "Waste removal",
                      ].map((option, i) => (
                        <div
                          key={i}
                          className={cn(
                            "p-3 rounded-lg border text-sm transition-colors",
                            i === 0
                              ? "bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400"
                              : "bg-muted/50 border-border"
                          )}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Correct! Great job.
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Floating analytics card */}
              <Card className="absolute -bottom-8 -left-8 w-48 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">Your Progress</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">87%</div>
                  <div className="text-xs text-muted-foreground">
                    Accuracy this week
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: "87%" }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Floating weak topics card */}
              <Card className="absolute -top-4 -right-4 w-44 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-medium">Focus Area</span>
                  </div>
                  <div className="text-sm font-medium">Cell Biology</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Needs more practice
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    {
      icon: Upload,
      title: "Upload Material",
      description:
        "Upload your notes, PDFs, or any study content. Our AI analyzes and extracts key topics.",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      icon: Brain,
      title: "Practice with AI",
      description:
        "Get automatically generated questions tailored to your material. Multiple question types available.",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    {
      icon: TrendingUp,
      title: "Improve Faster",
      description:
        "AI analyzes your mistakes and adapts to focus on your weak areas. Track your progress over time.",
      color: "bg-green-500/10 text-green-600 dark:text-green-400",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes with our simple three-step process
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-border" />
              )}

              <div className="text-center">
                <div className="relative inline-block">
                  <div
                    className={cn(
                      "w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6",
                      step.color
                    )}
                  >
                    <step.icon className="h-10 w-10" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: Sparkles,
      title: "AI Question Generation",
      description:
        "Automatically generate practice questions from any study material.",
    },
    {
      icon: Brain,
      title: "Adaptive Learning",
      description:
        "AI identifies weak areas and creates personalized practice sessions.",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description:
        "Track your progress with detailed performance analytics and insights.",
    },
    {
      icon: Target,
      title: "Personalized Practice",
      description:
        "Focus on topics that need the most attention with targeted drills.",
    },
    {
      icon: ListChecks,
      title: "Multi-format Questions",
      description:
        "Practice with MCQ, short answer, and true/false question types.",
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description:
        "Monitor your improvement over time with visual progress charts.",
    },
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to supercharge your learning experience
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Product Preview Section
function ProductPreviewSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            See It In Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time feedback and smart progress tracking
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Question Interface Preview */}
          <Card className="overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Practice Session</span>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    Question 3 of 10
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Biology - Cell Structure
                  </span>
                </div>
                <p className="font-medium text-lg">
                  Which organelle is responsible for protein synthesis?
                </p>
                <div className="space-y-2">
                  {["Ribosome", "Golgi apparatus", "Lysosome", "Nucleus"].map(
                    (option, i) => (
                      <div
                        key={i}
                        className={cn(
                          "p-3 rounded-lg border text-sm cursor-pointer transition-colors hover:bg-muted",
                          i === 0 ? "border-primary bg-primary/5" : ""
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                              i === 0 ? "border-primary" : "border-muted-foreground/30"
                            )}
                          >
                            {i === 0 && (
                              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                            )}
                          </div>
                          {option}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Preview */}
          <Card className="overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Analytics Dashboard</span>
            </div>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">156</div>
                    <div className="text-xs text-muted-foreground">
                      Questions
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">82%</div>
                    <div className="text-xs text-muted-foreground">
                      Accuracy
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-xs text-muted-foreground">Topics</div>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-3">
                  <div className="text-sm font-medium">Topic Mastery</div>
                  {[
                    { name: "Cell Biology", progress: 92, color: "bg-green-500" },
                    { name: "Genetics", progress: 78, color: "bg-blue-500" },
                    { name: "Evolution", progress: 65, color: "bg-yellow-500" },
                    { name: "Ecology", progress: 45, color: "bg-orange-500" },
                  ].map((topic, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{topic.name}</span>
                        <span className="text-muted-foreground">
                          {topic.progress}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", topic.color)}
                          style={{ width: `${topic.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

// Benefits Section
function BenefitsSection() {
  const benefits = [
    {
      icon: Clock,
      title: "Save Study Time",
      description:
        "Stop wasting time on what you already know. Focus on what matters.",
    },
    {
      icon: Target,
      title: "Focus on Weak Topics",
      description:
        "AI identifies and prioritizes areas where you need improvement.",
    },
    {
      icon: Zap,
      title: "Learn at Your Pace",
      description:
        "Study whenever and wherever you want with adaptive difficulty.",
    },
    {
      icon: Users,
      title: "Suitable for All Levels",
      description:
        "Whether you're a beginner or advanced, we adapt to your level.",
    },
  ];

  return (
    <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Why Students Love StudyAI
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Our AI-powered platform helps you study more efficiently and
              achieve better results in less time.
            </p>
            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Card */}
          <div className="relative">
            <Card className="p-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">3x</div>
                  <div className="text-sm text-muted-foreground">
                    Faster Learning
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">85%</div>
                  <div className="text-sm text-muted-foreground">
                    Better Retention
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">50%</div>
                  <div className="text-sm text-muted-foreground">
                    Less Study Time
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    24/7
                  </div>
                  <div className="text-sm text-muted-foreground">
                    AI Tutor Available
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah M.",
      role: "Medical Student",
      content:
        "This helped me focus only on what I don't understand. My exam scores improved significantly within weeks!",
      avatar: "S",
    },
    {
      name: "James K.",
      role: "Engineering Student",
      content:
        "The adaptive learning feature is amazing. It knows exactly what I need to practice next.",
      avatar: "J",
    },
    {
      name: "Emily R.",
      role: "High School Senior",
      content:
        "I used to spend hours studying inefficiently. Now I study smarter and have more free time.",
      avatar: "E",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            What Students Say
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of students who are studying smarter
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground italic">
                "{testimonial.content}"
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Zap className="h-4 w-4" />
          Start for free today
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          Start Your Smart Learning Journey Today
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of students who are already studying smarter with
          AI-powered personalized learning.
        </p>
        <Button
          size="lg"
          className="h-14 px-10 text-lg"
          onClick={() => navigate(isAuthenticated ? "/" : "/register")}
        >
          {isAuthenticated ? "Go to Dashboard" : "Create Free Account"}
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          No credit card required. Start learning in minutes.
        </p>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">StudyAI</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-md">
              AI-powered personalized learning platform. Study smarter, not
              harder, with adaptive practice and real-time feedback.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/register" className="hover:text-foreground transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                  className="hover:text-foreground transition-colors"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                  className="hover:text-foreground transition-colors"
                >
                  How it Works
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} StudyAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// Main HomePage Component
export function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <ProductPreviewSection />
        <BenefitsSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
