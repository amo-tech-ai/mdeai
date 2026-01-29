import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

// Generic item type for any entity (restaurant, event, apartment, car, etc.)
export interface SelectedItem {
  type: "restaurant" | "event" | "apartment" | "car" | "destination";
  id: string;
  data: any; // Full entity data
}

export interface ThreePanelContextType {
  // Right panel state
  selectedItem: SelectedItem | null;
  rightPanelOpen: boolean;
  
  // Left panel state
  leftPanelCollapsed: boolean;
  
  // View state
  viewMode: "grid" | "list" | "map";
  
  // Custom right panel content (for dashboards)
  rightPanelContent: ReactNode | null;
  
  // Actions
  openDetailPanel: (item: SelectedItem) => void;
  closeDetailPanel: () => void;
  toggleLeftPanel: () => void;
  setViewMode: (mode: "grid" | "list" | "map") => void;
  setRightPanelContent: (content: ReactNode | null) => void;
}

const ThreePanelContext = createContext<ThreePanelContextType | null>(null);

export function useThreePanelContext() {
  const context = useContext(ThreePanelContext);
  if (!context) {
    throw new Error("useThreePanelContext must be used within ThreePanelProvider");
  }
  return context;
}

// Alias for convenience
export const usePanel = useThreePanelContext;

interface ThreePanelProviderProps {
  children: ReactNode;
}

export function ThreePanelProvider({ children }: ThreePanelProviderProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [viewMode, setViewModeState] = useState<"grid" | "list" | "map">("grid");
  const [rightPanelContent, setRightPanelContentState] = useState<ReactNode | null>(null);

  // Open detail panel with URL sync
  const openDetailPanel = useCallback((item: SelectedItem) => {
    setSelectedItem(item);
    setRightPanelOpen(true);
    setRightPanelContentState(null); // Clear custom content when opening detail
    
    // Update URL with detail param
    const newParams = new URLSearchParams(searchParams);
    newParams.set("detail", item.id);
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Close detail panel with URL sync
  const closeDetailPanel = useCallback(() => {
    setRightPanelOpen(false);
    setSelectedItem(null);
    setRightPanelContentState(null);
    
    // Remove detail param from URL
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("detail");
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const toggleLeftPanel = useCallback(() => {
    setLeftPanelCollapsed((prev) => !prev);
  }, []);

  const setViewMode = useCallback((mode: "grid" | "list" | "map") => {
    setViewModeState(mode);
  }, []);

  // Set custom right panel content (opens panel if content is provided)
  const setRightPanelContent = useCallback((content: ReactNode | null) => {
    setRightPanelContentState(content);
    if (content) {
      setRightPanelOpen(true);
      setSelectedItem(null); // Clear item selection when using custom content
    }
  }, []);

  return (
    <ThreePanelContext.Provider
      value={{
        selectedItem,
        rightPanelOpen,
        leftPanelCollapsed,
        viewMode,
        rightPanelContent,
        openDetailPanel,
        closeDetailPanel,
        toggleLeftPanel,
        setViewMode,
        setRightPanelContent,
      }}
    >
      {children}
    </ThreePanelContext.Provider>
  );
}
