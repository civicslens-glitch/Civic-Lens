import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Menu, Bus, Save, Download, Building } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { motion } from 'framer-motion';

interface NavigationProps {
  onAddBusRoute: () => void;
  onSaveScenario: () => void;
  onExportScenario: () => void;
  onToggleMobileMenu: () => void;
}

export function Navigation({ 
  onAddBusRoute, 
  onSaveScenario, 
  onExportScenario, 
  onToggleMobileMenu 
}: NavigationProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 transition-colors duration-300"
    >
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-civic-blue rounded-lg flex items-center justify-center">
              <Building className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Civic Lens</h1>
            <span className="hidden sm:inline-block px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
              Digital Twin
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-4">
            {/* Scenario Controls */}
            <div className="hidden md:flex items-center space-x-2">
              <Button
                onClick={onAddBusRoute}
                className="flex items-center space-x-2 bg-civic-green text-white hover:bg-emerald-600 transition-colors duration-200"
                size="sm"
                data-testid="button-add-bus-route"
              >
                <Bus className="w-3 h-3" />
                <span>Add Bus Route</span>
              </Button>
              
              <Button
                onClick={onSaveScenario}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-2"
                data-testid="button-save-scenario"
              >
                <Save className="w-3 h-3" />
                <span className="hidden lg:inline">Save</span>
              </Button>

              <Button
                onClick={onExportScenario}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-2"
                data-testid="button-export-scenario"
              >
                <Download className="w-3 h-3" />
                <span className="hidden lg:inline">Export</span>
              </Button>
            </div>

            {/* Dark Mode Toggle */}
            <Button
              onClick={toggleDarkMode}
              variant="ghost"
              size="sm"
              className="p-2"
              data-testid="button-toggle-theme"
            >
              {isDarkMode ? 
                <Sun className="w-4 h-4 text-slate-600 dark:text-slate-300" /> : 
                <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              }
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              onClick={onToggleMobileMenu}
              variant="ghost"
              size="sm"
              className="md:hidden p-2"
              data-testid="button-toggle-mobile-menu"
            >
              <Menu className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
