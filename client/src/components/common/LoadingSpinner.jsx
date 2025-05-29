// src/components/common/LoadingSpinner.jsx
import React from 'react';
import { Loader2 } from 'lucide-react'; // A nice spinner icon from lucide-react

const LoadingSpinner = ({ size = 24, className = "" }) => {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <Loader2 className={`animate-spin text-primary h-${Math.floor(size/4)} w-${Math.floor(size/4)}`} style={{ height: `${size}px`, width: `${size}px` }} />
    </div>
  );
};

export default LoadingSpinner;