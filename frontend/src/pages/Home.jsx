import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowRight,
  Users,
  Briefcase,
  Shield,
  Brain,
  Mail,
  Bell,
  Zap,
  Star,
  ChevronLeft,
  ChevronRight,
  Twitter,
  Linkedin,
  Github,
  Facebook,
  Instagram,
  ExternalLink,
  CheckCircle2,
  TrendingUp,
  Target,
  Award,
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';

import { cn } from '../utils/cn';

const Home = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -50]);

  // Auto-advance testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Engineer",
      company: "Tech Innovations Inc",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      quote: "Resume Refresh helped me land my dream job! The AI matching was spot-on, and the resume optimization suggestions were incredibly valuable."
    },
    {
      name: "Michael Chen",
      role: "Talent Acquisition Manager",
      company: "Global Solutions Corp",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      quote: "As a recruiter, this platform has revolutionized how I find candidates. The AI matching saves me hours and delivers higher-quality matches."
    },
    {
      name: "Emily Rodriguez",
      role: "Product Manager",
      company: "StartupXYZ",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      quote: "The interactive resume refresh emails are genius! I love how I can update my profile directly from my inbox. So convenient and smart."
    },
    {
      name: "David Thompson",
      role: "HR Director", 
      company: "Enterprise Solutions",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      quote: "The analytics and insights help us make data-driven hiring decisions. The platform has improved our hiring efficiency by 40%."
    }
  ];

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Job Matching",
      description: "Advanced machine learning algorithms analyze your skills and experience to find the perfect job matches with 85%+ accuracy.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: RefreshCw,
      title: "Smart Resume Refresh",
      description: "Get weekly interactive emails with personalized suggestions to keep your resume optimized and ATS-friendly.",
      color: "from-orange-500 to-yellow-500"
    },
    {
      icon: Bell,
      title: "Intelligent Notifications",
      description: "Receive timely alerts about job matches, interview opportunities, and profile optimization tips tailored to your career goals.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Mail,
      title: "Interactive AMP Emails",
      description: "Update your profile and respond to opportunities directly from your email inbox with our cutting-edge AMP technology.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with role-based access control, encrypted data storage, and 99.9% uptime guarantee.",
      color: "from-red-500 to-rose-500"
    },
    {
      icon: Target,
      title: "ATS Optimization",
      description: "Get detailed ATS compatibility scores and recommendations to ensure your resume passes through applicant tracking systems.",
      color: "from-indigo-500 to-blue-500"
    }
  ];

  const stats = [
    { number: "50,000+", label: "Active Users", icon: Users },
    { number: "15,000+", label: "Jobs Matched", icon: Briefcase },
    { number: "98%", label: "Match Accuracy", icon: Target },
    { number: "24/7", label: "Support", icon: Shield }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const heroVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">RR</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Resume Refresh</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/auth/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/auth/register"
                className="btn btn-primary btn-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-gray-50 via-orange-50 to-yellow-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.div variants={heroVariants} className="mb-8">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
                <span className="block">Refresh Your Resume.</span>
                <span className="block bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                  Match the Right Job.
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                AI-powered job matching and resume optimization that connects talent with opportunity. 
                Transform your career with intelligent insights and personalized recommendations.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/auth/register"
                  className="btn btn-primary btn-xl group"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/auth/login"
                  className="btn btn-outline btn-xl border-gray-300 text-gray-700 hover:border-orange-500 hover:text-orange-600"
                >
                  Sign In
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl shadow-medium flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>

        {/* Floating elements */}
        <motion.div
          style={{ y: y1 }}
          className="absolute top-20 left-10 w-20 h-20 bg-orange-200 rounded-full opacity-20"
        />
        <motion.div
          style={{ y: y2 }}
          className="absolute top-40 right-10 w-32 h-32 bg-yellow-200 rounded-full opacity-20"
        />
      </section>

      {/* Role Highlights */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Every Career Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're seeking your next opportunity or finding top talent, 
              our platform adapts to your unique needs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Job Seekers",
                description: "Optimize your resume with AI insights, discover perfect job matches, and get noticed by top recruiters.",
                features: ["AI Resume Analysis", "Smart Job Matching", "ATS Optimization", "Career Insights"],
                color: "from-blue-500 to-cyan-500",
                cta: "Start Job Search"
              },
              {
                icon: Briefcase,
                title: "Recruiters",
                description: "Find exceptional candidates faster with AI-powered matching, analytics, and streamlined hiring workflows.",
                features: ["Candidate Matching", "Hiring Analytics", "Bulk Communications", "Performance Tracking"],
                color: "from-green-500 to-emerald-500",
                cta: "Start Recruiting"
              },
              {
                icon: Shield,
                title: "Administrators",
                description: "Manage the entire platform with comprehensive admin tools, system monitoring, and user management.",
                features: ["System Monitoring", "User Management", "Analytics Dashboard", "Feature Controls"],
                color: "from-red-500 to-rose-500",
                cta: "Admin Access"
              }
            ].map((role, index) => {
              const Icon = role.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="bg-white rounded-2xl shadow-large border border-gray-100 p-8 text-center group hover:shadow-xl transition-all duration-300"
                >
                  <div className={cn(
                    "w-16 h-16 bg-gradient-to-r rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform",
                    role.color
                  )}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{role.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{role.description}</p>
                  
                  <div className="space-y-3 mb-8">
                    {role.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center justify-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link
                    to="/auth/register"
                    className={cn(
                      "btn btn-md w-full bg-gradient-to-r text-white group-hover:shadow-lg transition-all",
                      role.color
                    )}
                  >
                    {role.cta}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Careers
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cutting-edge AI technology combined with intuitive design to accelerate your career growth 
              and streamline the hiring process.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-medium border border-gray-100 p-6 hover:shadow-large transition-all duration-300"
                >
                  <div className={cn(
                    "w-12 h-12 bg-gradient-to-r rounded-xl flex items-center justify-center mb-4",
                    feature.color
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by Professionals Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of job seekers and recruiters who have transformed their careers 
              with Resume Refresh Platform.
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            {/* Testimonial Carousel */}
            <div className="overflow-hidden">
              <motion.div
                animate={{ x: -currentTestimonial * 100 + '%' }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="flex"
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 md:p-12 text-center border border-orange-100"
                    >
                      <div className="flex justify-center mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      
                      <blockquote className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
                        "{testimonial.quote}"
                      </blockquote>
                      
                      <div className="flex items-center justify-center space-x-4">
                        <img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">{testimonial.name}</div>
                          <div className="text-gray-600">{testimonial.role}</div>
                          <div className="text-sm text-orange-600">{testimonial.company}</div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Carousel Controls */}
            <div className="flex items-center justify-center space-x-4 mt-8">
              <button
                onClick={() => setCurrentTestimonial((prev) => 
                  prev === 0 ? testimonials.length - 1 : prev - 1
                )}
                className="p-2 rounded-full bg-white shadow-medium hover:shadow-large transition-shadow"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={cn(
                      "w-3 h-3 rounded-full transition-colors",
                      currentTestimonial === index ? "bg-orange-500" : "bg-gray-300"
                    )}
                  />
                ))}
              </div>
              
              <button
                onClick={() => setCurrentTestimonial((prev) => 
                  (prev + 1) % testimonials.length
                )}
                className="p-2 rounded-full bg-white shadow-medium hover:shadow-large transition-shadow"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-yellow-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Career?
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who have accelerated their careers with AI-powered insights.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/auth/register"
                  className="btn btn-white btn-xl text-orange-600 hover:text-orange-700"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Free Today
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/auth/login"
                  className="btn btn-outline btn-xl border-white text-white hover:bg-white hover:text-orange-600"
                >
                  Sign In Now
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">RR</span>
                </div>
                <span className="text-xl font-bold">Resume Refresh</span>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                AI-powered career acceleration platform connecting talent with opportunity through intelligent matching and optimization.
              </p>
              
              {/* Social Media */}
              <div className="flex space-x-4">
                {[
                  { icon: Twitter, href: "#", label: "Twitter" },
                  { icon: Linkedin, href: "#", label: "LinkedIn" },
                  { icon: Github, href: "#", label: "GitHub" },
                  { icon: Facebook, href: "#", label: "Facebook" }
                ].map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={index}
                      href={social.href}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-orange-600 transition-colors"
                      aria-label={social.label}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.a>
                  );
                })}
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                {[
                  { name: "Features", href: "#features" },
                  { name: "Job Matching", href: "/auth/register" },
                  { name: "Resume Optimization", href: "/auth/register" },
                  { name: "Analytics", href: "/auth/register" },
                  { name: "Pricing", href: "#pricing" }
                ].map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                {[
                  { name: "About Us", href: "#about" },
                  { name: "Careers", href: "#careers" },
                  { name: "Blog", href: "#blog" },
                  { name: "Press", href: "#press" },
                  { name: "Contact", href: "#contact" }
                ].map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                {[
                  { name: "Privacy Policy", href: "/privacy" },
                  { name: "Terms of Service", href: "/terms" },
                  { name: "Cookie Policy", href: "/cookies" },
                  { name: "GDPR", href: "/gdpr" },
                  { name: "Security", href: "/security" }
                ].map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-gray-400 text-sm">
                © 2024 Resume Refresh Platform. All rights reserved.
              </p>
              
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>All systems operational</span>
                </div>
                
                <a
                  href="/status"
                  className="text-sm text-gray-400 hover:text-white transition-colors flex items-center"
                >
                  System Status
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
