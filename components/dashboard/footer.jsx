"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useAnimation, useInView } from "framer-motion";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Github,
  Heart,
  Sparkles,
  Rocket,
  Shield,
  Zap,
  Globe,
  ChevronRight,
  Send,
  Leaf,
  Award,
  TrendingUp,
  Users,
  Coffee,
  Moon,
  Sun,
  Navigation,
  Compass,
  Map,
  Building,
  GraduationCap,
  Library,
  Trees,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Layers,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [glowingElement, setGlowingElement] = useState(null);
  const [mapHovered, setMapHovered] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [activeLandmark, setActiveLandmark] = useState(null);
  const mapRef = useRef(null);

  const floatingAnimation = {
    y: ["-5px", "5px", "-5px"],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  const greenGlow = {
    boxShadow: [
      "0 0 5px #4ade80",
      "0 0 20px #4ade80",
      "0 0 5px #4ade80",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  const socialLinks = [
    { icon: Facebook, href: "#", color: "hover:bg-[#1877F2]", name: "facebook" },
    { icon: Instagram, href: "#", color: "hover:bg-[#E4405F]", name: "instagram" },
    { icon: Linkedin, href: "#", color: "hover:bg-[#0A66C2]", name: "linkedin" },
    { icon: Github, href: "#", color: "hover:bg-[#333]", name: "github" },
  ];

  const quickLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Zap },
    { href: "/dashboard/items", label: "Browse Items", icon: Globe },
    { href: "/businesses", label: "Businesses", icon: Rocket },
    { href: "/dashboard/requests", label: "Request Item", icon: Send },
    { href: "/dashboard/chat", label: "Messages", icon: Mail },
    { href: "/dashboard/profile", label: "My Profile", icon: Shield },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  // GJUS&T Campus details
  const campusDetails = {
    name: "Guru Jambheshwar University of Science & Technology",
    location: "Hisar-Sirsa Road, Hisar, Haryana 125001",
    coordinates: "29°10'36.6\"N 75°43'48.7\"E",
    area: "372 acres",
    established: "1995",
    landmarks: [
      { name: "Central Library", icon: Library, coords: "29.1735,75.7242", description: "55,833 sq ft knowledge hub" },
      { name: "Sports Complex", icon: Trees, coords: "29.1742,75.7218", description: "40-acre sports facility" },
      { name: "Academic Block", icon: GraduationCap, coords: "29.1722,75.7225", description: "8 teaching blocks" },
    ]
  };

  const toggleMapExpand = () => {
    setMapExpanded(!mapExpanded);
  };

  const zoomIn = () => {
    if (mapRef.current) {
      const iframe = mapRef.current;
      const src = iframe.src;
      const zoomMatch = src.match(/zoom=(\d+)/);
      let zoom = 15;
      if (zoomMatch) {
        zoom = parseInt(zoomMatch[1]) + 1;
      }
      const newSrc = src.replace(/zoom=\d+/, `zoom=${zoom}`);
      iframe.src = newSrc;
    }
  };

  const zoomOut = () => {
    if (mapRef.current) {
      const iframe = mapRef.current;
      const src = iframe.src;
      const zoomMatch = src.match(/zoom=(\d+)/);
      let zoom = 15;
      if (zoomMatch) {
        zoom = Math.max(10, parseInt(zoomMatch[1]) - 1);
      }
      const newSrc = src.replace(/zoom=\d+/, `zoom=${zoom}`);
      iframe.src = newSrc;
    }
  };

  const resetMap = () => {
    if (mapRef.current) {
      const iframe = mapRef.current;
      iframe.src = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13915.895690919402!2d75.719144!3d29.173544!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391232b4b8c1e8c5%3A0x8c8b8b8b8b8b8b8b!2sGuru%20Jambheshwar%20University%20of%20Science%20and%20Technology!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin";
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full text-white mt-auto relative overflow-hidden bg-black border-t border-gray-800">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(74, 222, 128, 0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Animated Green Orbs */}
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-green-500/10 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-green-500/10 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, 30, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
        >
          {/* Brand Section */}
          <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
            <motion.div
              className="flex items-center space-x-3"
              animate={floatingAnimation}
              onHoverStart={() => setGlowingElement('brand')}
              onHoverEnd={() => setGlowingElement(null)}
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ duration: 0.6, type: "spring" }}
                animate={glowingElement === 'brand' ? greenGlow : {}}
                className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-transparent"
              >
                <img src="/logo.png" alt="DormAce" className="h-8 w-8 invert" />
              </motion.div>
              <div>
                <span className="text-2xl font-bold">
                  <span className="text-white">Dorm</span>
                  <span className="text-white-400 relative">
                    Ace
                    <motion.span
                      className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-green-400 to-transparent"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                    />
                  </span>
                </span>
              </div>
            </motion.div>

            <motion.p
              className="text-gray-400 text-sm leading-relaxed"
              whileHover={{ color: "#ffffff" }}
              transition={{ duration: 0.3 }}
            >
              Your one-stop marketplace for hostel essentials. Buy, sell, and
              request items within your hostel community. Connect, trade, and
              thrive together.
            </motion.p>

            {/* Social Links */}
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  className="relative group"
                  whileHover={{ scale: 1.15, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onHoverStart={() => setHoveredIcon(social.name)}
                  onHoverEnd={() => setHoveredIcon(null)}
                >
                  <motion.div
                    className="absolute inset-0 bg-green-400 rounded-full blur-md opacity-0 group-hover:opacity-60"
                    animate={{
                      scale: hoveredIcon === social.name ? [1, 1.5, 1] : 1,
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <div className="relative p-2.5 rounded-full bg-white/5 border border-gray-800 group-hover:border-green-400/50 transition-all duration-300 backdrop-blur-sm">
                    <social.icon className="h-4 w-4 text-gray-400 group-hover:text-green-400" />
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-6 text-white relative inline-block">
              Quick Links
              <motion.div
                className="absolute -bottom-2 left-0 h-0.5 bg-green-400"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link, idx) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-green-400 transition-all duration-300 text-sm flex items-center gap-3 group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      className={`p-1.5 rounded-lg bg-transparent group-hover:bg-green-500/20 transition-colors`}
                    >
                      <link.icon className="h-3.5 w-3.5" />
                    </motion.div>
                    <span className="group-hover:translate-x-1 transition-transform">
                      {link.label}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Interactive Campus Map */}
          <motion.div 
            variants={itemVariants} 
            className="lg:col-span-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white relative inline-block">
                Campus Map
                <motion.div
                  className="absolute -bottom-2 left-0 h-0.5 bg-gradient-to-r from-green-400 to-transparent"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </h3>
              
            </div>

            {/* Map Container */}
            <motion.div
              className={`relative overflow-hidden rounded-2xl border border-gray-800 group ${
                mapExpanded ? 'fixed inset-8 z-50 h-auto' : 'h-80'
              }`}
              onHoverStart={() => setMapHovered(true)}
              onHoverEnd={() => setMapHovered(false)}
              layout
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="relative w-full h-full bg-gray-900">
                {/* Map iframe */}
                <iframe
                  ref={mapRef}
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13915.895690919402!2d75.719144!3d29.173544!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391232b4b8c1e8c5%3A0x8c8b8b8b8b8b8b8b!2sGuru%20Jambheshwar%20University%20of%20Science%20and%20Technology!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                  className="absolute inset-0 w-full h-full"
                  style={{ border: 0, filter: mapHovered ? 'brightness(1)' : 'brightness(0.8)' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="GJUS&T Campus"
                  onLoad={() => setMapLoaded(true)}
                />

                {/* Loading State */}
                {!mapLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-10 h-10 border-2 border-green-400 border-t-transparent rounded-full"
                    />
                  </div>
                )}

                {/* Map Controls Overlay */}
                <motion.div
                  className="absolute top-4 right-4 flex flex-col gap-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: mapHovered ? 1 : 0, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {[
                    { icon: ZoomIn, action: zoomIn, label: "Zoom In" },
                    { icon: ZoomOut, action: zoomOut, label: "Zoom Out" },
                    { icon: RotateCw, action: resetMap, label: "Reset" },
                  ].map((control, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(74, 222, 128, 0.2)" }}
                      whileTap={{ scale: 0.9 }}
                      onClick={control.action}
                      className="p-2.5 bg-black/70 backdrop-blur-sm rounded-lg border border-gray-700 hover:border-green-400 transition-all"
                      title={control.label}
                    >
                      <control.icon className="h-4 w-4 text-green-400" />
                    </motion.button>
                  ))}
                </motion.div>

                {/* Campus Info Overlay */}
                <motion.div
                  className="absolute top-4 left-4 flex flex-wrap gap-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-green-500/30">
                    <span className="text-xs text-white flex items-center gap-1.5">
                      <Building className="h-3 w-3 text-green-400" />
                      372 Acres
                    </span>
                  </div>
                  <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-green-500/30">
                    <span className="text-xs text-white flex items-center gap-1.5">
                      <GraduationCap className="h-3 w-3 text-green-400" />
                      Est. 1995
                    </span>
                  </div>
                </motion.div>

                {/* Landmarks */}
                {showLandmarks && (
                  <motion.div
                    className="absolute bottom-4 left-4 right-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex flex-wrap gap-2 justify-center">
                      {campusDetails.landmarks.map((landmark, idx) => (
                        <motion.div
                          key={idx}
                          className="relative group/landmark"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onHoverStart={() => setActiveLandmark(landmark.name)}
                          onHoverEnd={() => setActiveLandmark(null)}
                        >
                          <div className="bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 border border-green-500/30 hover:border-green-400 transition-all cursor-pointer">
                            <span className="text-xs text-white flex items-center gap-1.5">
                              <landmark.icon className="h-3 w-3 text-green-400" />
                              {landmark.name}
                            </span>
                          </div>
                          
                          {/* Tooltip */}
                          {activeLandmark === landmark.name && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-40 p-2 bg-black/90 backdrop-blur-sm rounded-lg border border-green-500/30 text-xs text-gray-300 z-20"
                            >
                              {landmark.description}
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Location Marker */}
                <motion.div
                  className="absolute"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                  animate={{
                    y: mapHovered ? [null, -5, 5, -5] : 0,
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="relative">
                    <motion.div
                      className="absolute inset-0 bg-green-400 rounded-full blur-xl"
                      animate={{
                        scale: [1, 1.8, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <MapPin className="h-8 w-8 text-green-400 relative z-10 drop-shadow-lg" />
                  </div>
                </motion.div>
              </div>

              {/* Map Footer */}
              <motion.a
                href="https://maps.google.com/?q=Guru+Jambheshwar+University+Hisar"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-900/90 backdrop-blur-sm border-t border-gray-800 hover:bg-green-500/10 transition-all group"
                whileHover={{ backgroundColor: "rgba(74, 222, 128, 0.1)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-green-400" />
                    <span className="text-xs text-gray-400 group-hover:text-green-400 transition-colors">
                      {campusDetails.location}
                    </span>
                  </div>
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ChevronRight className="h-4 w-4 text-green-400" />
                  </motion.span>
                </div>
              </motion.a>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12"
        >
          <div className="relative">
            {/* Animated border */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/30 via-transparent to-green-500/30"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ filter: "blur(10px)" }}
            />

            <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl border border-gray-800/50 p-5">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
                <motion.p
                  className="hover:text-white transition-colors duration-300 flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                >
                  <span>© {currentYear}</span>
                  <span className="font-bold text-white">DormAce</span>
                  <span>• All rights reserved.</span>
                </motion.p>

                <motion.p
                  className="flex items-center gap-2"
                  animate={{
                    color: ["#6B7280", "#9CA3AF", "#6B7280"],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <span>Made with</span>
                  <motion.span
                    className="text-green-400 inline-block"
                    animate={{
                      scale: [1, 1.3, 1],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </motion.span>
                  <span>for</span>
                  <motion.span
                    className="font-semibold text-white relative group cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                  >
                    GJUS&T, Hisar
                    <motion.span
                      className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-transparent group-hover:w-full transition-all duration-300"
                    />
                  </motion.span>
                </motion.p>

                {/* Back to top */}
                <motion.button
                  onClick={scrollToTop}
                  className="p-2 rounded-full bg-white/5 hover:bg-green-500/20 border border-gray-800 transition-all backdrop-blur-sm"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  title="Back to top"
                >
                  <ChevronUp className="h-4 w-4 text-green-400" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Expanded Map Backdrop */}
      {mapExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40"
          onClick={toggleMapExpand}
        />
      )}
    </footer>
  );
}