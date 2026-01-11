import { createContext, useContext, useState, useCallback } from 'react';

const SceneContext = createContext(null);

export const useScene = () => {
    const context = useContext(SceneContext);
    if (!context) {
        throw new Error('useScene must be used within a SceneProvider');
    }
    return context;
};

export const SceneProvider = ({ children }) => {
    const [currentRoom, setCurrentRoom] = useState(null); // null = corridor, 'about', 'portfolio', etc.
    const [hasEntered, setHasEntered] = useState(false);  // Has user clicked entrance doors?
    const [exitRequested, setExitRequested] = useState(false); // Signal to request exit from room
    const [overlayContent, setOverlayContent] = useState(null); // Content for overlay (Studio monitor etc)

    const enterRoom = useCallback((roomId) => {
        setCurrentRoom(roomId);
        setExitRequested(false); // Clear any pending exit request
        setOverlayContent(null); // Clear overlay on room change
    }, []);

    const exitRoom = useCallback(() => {
        setCurrentRoom(null);
        setExitRequested(false);
        setOverlayContent(null);
    }, []);

    // Request exit - this signals to DoorSection to trigger exit animation
    const requestExit = useCallback(() => {
        setExitRequested(true);
        setOverlayContent(null);
    }, []);

    // Clear exit request - called by DoorSection after handling
    const clearExitRequest = useCallback(() => {
        setExitRequested(false);
    }, []);

    const markEntered = useCallback(() => {
        setHasEntered(true);
    }, []);

    const openOverlay = useCallback((content) => {
        setOverlayContent(content);
    }, []);

    const closeOverlay = useCallback(() => {
        setOverlayContent(null);
    }, []);

    const value = {
        currentRoom,
        hasEntered,
        exitRequested,
        overlayContent, // Exposed
        enterRoom,
        exitRoom,
        requestExit,
        clearExitRequest,
        markEntered,
        openOverlay,    // Exposed
        closeOverlay,   // Exposed
        isInRoom: currentRoom !== null,
    };

    return (
        <SceneContext.Provider value={value}>
            {children}
        </SceneContext.Provider>
    );
};

export default SceneContext;
