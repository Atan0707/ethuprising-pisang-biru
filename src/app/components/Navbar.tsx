"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Add the formatAddress function
  const formatAddress = (address: string | undefined) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Remove the setActiveLink related code in useEffect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Add scroll event listener to change navbar appearance on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Add event listeners for wallet connection events
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleConnected = () => {
        toast.success("Wallet Connected", {
          description: "Your wallet has been connected successfully.",
          icon: "🦊",
        });
      };

      const handleDisconnected = () => {
        toast.error("Wallet Disconnected", {
          description: "Your wallet has been disconnected.",
          icon: "🔌",
        });
      };

      const handleChainChanged = () => {
        toast.info("Network Changed", {
          description: "You have switched to a different blockchain network.",
          icon: "🔄",
        });
      };

      document.addEventListener("appkit:connected", handleConnected);
      document.addEventListener("appkit:disconnected", handleDisconnected);
      document.addEventListener("appkit:chain-changed", handleChainChanged);

      return () => {
        document.removeEventListener("appkit:connected", handleConnected);
        document.removeEventListener("appkit:disconnected", handleDisconnected);
        document.removeEventListener(
          "appkit:chain-changed",
          handleChainChanged
        );
      };
    }
  }, []);

  // Handle wallet connection
  const handleConnectClick = () => {
    // toast.info('Connecting Wallet', {
    //   description: 'Please approve the connection request in your wallet.',
    //   icon: '🔗',
    //   duration: 100,  // Auto dismiss after 5 seconds
    //   dismissible: true, // Allow manual dismissal
    // })
    open();
  };

  // Close mobile menu when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, [mobileMenuOpen]);

  // Update the isActive function to use pathname directly
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-20 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 dark:bg-black/90 backdrop-blur-sm shadow-md"
          : "bg-white dark:bg-black"
      } border-b border-gray-200 dark:border-gray-800`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Blocknogotchi
              </span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              <Link
                href="/mint"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/mint")
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                Mint
              </Link>
              <Link
                href="/claim"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                  isActive("/claim")
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Claim
              </Link>
              <Link
                href="/blockmon"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/blockmon")
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                Blockmon
              </Link>
              <Link
                href="/arena"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/arena")
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                Arena
              </Link>
              <Link
                href="/p2p"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/p2p")
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                P2P
              </Link>
              <Link
                href="/battle"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/battle")
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                Battle
              </Link>
              <Link
                href="/leaderboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/leaderboard")
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                Leaderboard
              </Link>
              {isConnected && (
                <Link
                  href="/profile"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                    isActive("/profile") || isActive("/owner")
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  My Blockmon
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {mounted && (
              <>
                {isConnected && address ? (
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        open({ view: "Account" });
                        toast("Account Details", {
                          description: "Viewing your wallet account details.",
                          icon: "👤",
                        });
                      }}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs sm:text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      {formatAddress(address)}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectClick}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Connect
                  </button>
                )}
                <button
                  onClick={() => {
                    open({ view: "Networks" });
                    toast("Network Selection", {
                      description: "Choose a blockchain network to connect to.",
                      icon: "🌐",
                    });
                  }}
                  className="hidden sm:block px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-gray-200 dark:border-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Networks
                </button>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none md:hidden"
                  aria-expanded={mobileMenuOpen}
                >
                  <span className="sr-only">Open main menu</span>
                  <svg
                    className={`${mobileMenuOpen ? "hidden" : "block"} h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  <svg
                    className={`${mobileMenuOpen ? "block" : "hidden"} h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu, with animation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-800">
              <Link
                href="/mint"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive("/mint")
                    ? "text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Mint
              </Link>
              <Link
                href="/claim"
                className={`px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center ${
                  isActive("/claim")
                    ? "text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Claim
              </Link>
              <Link
                href="/blockmon"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive("/blockmon")
                    ? "text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Blockmon
              </Link>
              <Link
                href="/arena"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive("/arena")
                    ? "text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Arena
              </Link>
              <Link
                href="/marketplace"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive("/marketplace")
                    ? "text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Marketplace
              </Link>
              <Link
                href="/battle"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive("/battle")
                    ? "text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Battle
              </Link>
              <Link
                href="/leaderboard"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive("/leaderboard")
                    ? "text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Leaderboard
              </Link>
              {isConnected && (
                <Link
                  href="/profile"
                  className={`px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center ${
                    isActive("/profile") || isActive("/owner")
                      ? "text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  My Blockmon
                </Link>
              )}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                <button
                  onClick={() => {
                    open({ view: "Networks" });
                    toast("Network Selection", {
                      description: "Choose a blockchain network to connect to.",
                      icon: "🌐",
                    });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Switch Network
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
