import { Moon, Sun, Menu, Bus, Save, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { motion } from "framer-motion";

interface NavbarProps {
  onAddBusRoute: () => void;
  onSaveScenario: () => void;
  onExportScenario: () => void;
  onToggleMobileMenu: () => void;
  isMobile?: boolean;
}

export function Navbar({
  onAddBusRoute,
  onSaveScenario,
  onExportScenario,
  onToggleMobileMenu,
  isMobile = false,
}: NavbarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 transition-colors duration-300"
      data-testid="navbar"
    >
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"
            >
              <i className="fas fa-city text-white text-sm"></i>
            </motion.div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              Civic Lens
            </h1>
            <span className="hidden sm:inline-block px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
              Digital Twin
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-4">
            {/* Scenario Controls - Hidden on Mobile */}
            {!isMobile && (
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  onClick={onAddBusRoute}
                  className="flex items-center space-x-2 bg-civic-green hover:bg-emerald-600 text-white"
                  size="sm"
                  data-testid="button-add-bus-route"
                >
                  <Bus className="w-4 h-4" />
                  <span>Add Bus Route</span>
                </Button>

                <Button
                  onClick={onSaveScenario}
                  variant="secondary"
                  className="flex items-center space-x-2"
                  size="sm"
                  data-testid="button-save-scenario"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden lg:inline">Save</span>
                </Button>

                <Button
                  onClick={onExportScenario}
                  variant="secondary"
                  className="flex items-center space-x-2"
                  size="sm"
                  data-testid="button-export-scenario"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden lg:inline">Export</span>
                </Button>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <Button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              variant="ghost"
              size="sm"
              className="p-2"
              data-testid="button-toggle-theme"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>

            {/* Mobile Menu Toggle */}
            {isMobile && (
              <Button
                onClick={onToggleMobileMenu}
                variant="ghost"
                size="sm"
                className="md:hidden p-2"
                data-testid="button-toggle-mobile-menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
