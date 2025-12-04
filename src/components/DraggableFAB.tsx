
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PlusIcon } from './Icons';

interface DraggableFABProps {
    onClick: () => void;
}

const DraggableFAB: React.FC<DraggableFABProps> = ({ onClick }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    // Use strict check for DOM availability
    const [canRender, setCanRender] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const hasMovedRef = useRef(false);

    useEffect(() => {
        // Delay rendering until client-side hydration is complete and body exists
        if (typeof document !== 'undefined' && document.body) {
            setCanRender(true);
            
            // Initialize position higher up on mobile to avoid pagination overlap
            const isMobile = window.innerWidth < 640;
            setPosition({ 
                x: window.innerWidth - 80, 
                y: window.innerHeight - (isMobile ? 140 : 100)
            });
        }

        const handleResize = () => {
             if (typeof window === 'undefined') return;
             const isMobile = window.innerWidth < 640;
             setPosition(prev => ({
                 x: Math.min(prev.x, window.innerWidth - 80),
                 y: Math.min(prev.y, window.innerHeight - (isMobile ? 140 : 80))
             }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        hasMovedRef.current = false;
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;
        
        // Clamp within window
        const clampedX = Math.max(10, Math.min(window.innerWidth - 70, newX));
        const clampedY = Math.max(10, Math.min(window.innerHeight - 70, newY));

        // Check if moved significantly (threshold 2px) to distinguish click from drag
        if (Math.abs(clampedX - position.x) > 2 || Math.abs(clampedY - position.y) > 2) {
            hasMovedRef.current = true;
        }

        setPosition({ x: clampedX, y: clampedY });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
        if (!hasMovedRef.current) {
            onClick();
        }
    };

    // Strict null check for portal container
    if (!canRender || typeof document === 'undefined' || !document.body) {
        return null;
    }

    return createPortal(
        <button
            style={{ left: position.x, top: position.y, touchAction: 'none' }}
            className={`fixed z-50 p-4 bg-[#003DA5] text-white rounded-full shadow-xl shadow-blue-900/30 hover:bg-[#002a70] hover:scale-110 transition-transform active:scale-95 flex items-center justify-center cursor-move group font-sans ${isDragging ? 'scale-110 cursor-grabbing shadow-2xl' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            title="Tạo mới (Kéo để di chuyển)"
        >
            <PlusIcon className="h-7 w-7 transition-transform group-hover:rotate-90" />
        </button>,
        document.body
    );
};

export default DraggableFAB;
