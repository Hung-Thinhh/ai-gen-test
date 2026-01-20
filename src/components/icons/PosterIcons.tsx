/**
 * Orange-themed SVG Icons for Poster Generator V2
 */
import React from 'react';

const iconColor = '#FF6B2C'; // Orange brand color

export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill={iconColor} />
        <path d="M19 3L19.5 5.5L22 6L19.5 6.5L19 9L18.5 6.5L16 6L18.5 5.5L19 3Z" fill={iconColor} />
        <path d="M19 15L19.5 17.5L22 18L19.5 18.5L19 21L18.5 18.5L16 18L18.5 17.5L19 15Z" fill={iconColor} />
    </svg>
);

export const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="6" width="20" height="14" rx="2" fill={iconColor} />
        <circle cx="12" cy="13" r="3" fill="white" />
        <path d="M8 6L9 4H15L16 6" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
        <circle cx="18" cy="9" r="1" fill="white" />
        <path d="M19 3H20V4H19V3Z" fill={iconColor} />
    </svg>
);

export const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="#ff5d05" height="200px" width="200px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 300 300" xmlSpace="preserve" stroke="#ff5d05"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M149.997,0.003C67.156,0.003,0,67.161,0,150s67.156,149.997,149.997,149.997C232.834,299.997,300,232.837,300,150 C300,67.158,232.834,0.003,149.997,0.003z M110.967,81.483l31.712-31.709c2.077-2.075,4.79-3.105,7.506-3.105 c0.026,0,0.054,0,0.078,0c0.029,0,0.054,0,0.078,0c2.715,0,5.434,1.03,7.511,3.105l31.707,31.709c4.15,4.147,4.15,10.872,0,15.017 c-2.072,2.075-4.793,3.112-7.508,3.112c-2.721,0-5.436-1.037-7.508-3.112l-14.016-14.013v32.259v20.749v3.888 c0,5.867-4.757,10.621-10.623,10.621c-5.867,0-10.618-4.754-10.618-10.621v-3.888v-20.749V83.207l-13.297,13.295 c-2.077,2.075-4.793,3.112-7.508,3.112c-2.721,0-5.436-1.037-7.511-3.112C106.819,92.355,106.819,85.627,110.967,81.483z M231.576,209.318h-0.003c0,14.335-14.057,25.565-32.005,25.565h-99.132c-17.945,0-32.005-11.23-32.005-25.565V140.31 c0-14.337,14.057-25.568,32.005-25.568h13.385c1.522,0.272,3.079,0.431,4.658,0.431c1.569,0,3.115-0.161,4.63-0.431h0.612v20.749 h-23.285c-7.265,0-11.256,3.621-11.256,4.819v69.008c0,1.198,3.992,4.816,11.256,4.816h99.135c7.265,0,11.256-3.621,11.256-4.816 V140.31c0-1.198-3.992-4.819-11.256-4.819h-23.485v-20.749h1.437c1.481,0.257,2.988,0.431,4.526,0.431 c1.579,0,3.133-0.158,4.658-0.431h12.864c17.948,0,32.005,11.233,32.005,25.568V209.318z"></path> </g> </g> </g></svg>
);

export const ShapesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4L17 12H7L12 4Z" fill={iconColor} />
        <rect x="4" y="14" width="6" height="6" rx="1" fill={iconColor} />
        <circle cx="17" cy="17" r="3" fill={iconColor} />
    </svg>
);

export const GridIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="6" height="6" rx="1" fill={iconColor} />
        <rect x="13" y="5" width="6" height="6" rx="1" fill={iconColor} />
        <rect x="5" y="13" width="6" height="6" rx="1" fill={iconColor} />
        <rect x="13" y="13" width="6" height="6" rx="1" fill={iconColor} />
    </svg>
);

export const TextIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 6H19V8H13V20H11V8H5V6Z" fill={iconColor} />
        <path d="M16 13H20V15H18V20H17V15H16V13Z" fill={iconColor} />
    </svg>
);

export const NoteIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="#ff5900" height="200px" width="200px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 279 279" xmlSpace="preserve" transform="matrix(1, 0, 0, -1, 0, 0)" stroke="#ff5900"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M262.427,7.5c0-4.143-3.024-7.5-7.167-7.5h-231c-4.143,0-7.833,3.357-7.833,7.5v264c0,4.143,3.69,7.5,7.833,7.5h132.498 c2.002,0,3.921-0.801,5.33-2.224l49.07-49.567l49.405-49.405c1.455-1.456,2.032-3.41,2.01-5.391 c0.008-0.137-0.146-0.274-0.146-0.413V7.5z M237.153,180l-73.727,73.394V180H237.153z M82.01,40h115.5c4.556,0,8.25,3.944,8.25,8.5 s-3.694,8.5-8.25,8.5H82.01c-4.556,0-8.25-3.944-8.25-8.5S77.453,40,82.01,40z M82.01,81h115.5c4.556,0,8.25,3.944,8.25,8.5 s-3.694,8.5-8.25,8.5H82.01c-4.556,0-8.25-3.944-8.25-8.5S77.453,81,82.01,81z M73.76,131c0-4.556,3.694-8,8.25-8h115.5 c4.556,0,8.25,3.444,8.25,8s-3.694,8-8.25,8H82.01C77.453,139,73.76,135.556,73.76,131z"></path> </g></svg>
);

export const RulerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 17 17" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>1244</title> <defs> </defs> <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g transform="translate(1.000000, 3.000000)" fill="#f06000"> <rect x="2" y="2" width="12" height="8" > </rect> <path d="M2.918,11.938 L0,11.938 L0,9.062 L1,9.062 L1,11.042 L2.918,11.042 L2.918,11.938 Z" > </path> <path d="M16,11.938 L13.062,11.938 L13.062,11.042 L15,11.042 L15,9.058 L16,9.058 L16,11.938 Z"> </path> <path d="M16,2.917 L15,2.917 L15,0.967 L13.057,0.967 L13.057,0.021 L16,0.021 L16,2.917 Z" > </path> <path d="M1,2.938 L0,2.938 L0,0 L2.938,0 L2.938,0.938 L1,0.938 L1,2.938 Z" > </path> </g> </g> </g></svg>
);

export const PaletteIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C13.66 22 15 20.66 15 19C15 18.34 14.74 17.74 14.34 17.29C13.95 16.85 13.71 16.28 13.71 15.66C13.71 14.47 14.67 13.5 15.86 13.5H17.5C20 13.5 22 11.5 22 9C22 5.13 17.52 2 12 2Z" fill={iconColor} />
        <circle cx="7" cy="10" r="1.5" fill="white" />
        <circle cx="10" cy="7" r="1.5" fill="white" />
        <circle cx="14" cy="7" r="1.5" fill="white" />
        <circle cx="17" cy="10" r="1.5" fill="white" />
    </svg>
);

export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8Z" fill="white" />
        <path fillRule="evenodd" clipRule="evenodd" d="M10.4 2L9.6 2.9L8 3.5L7.5 5.1L6 6L5.1 7.4L5.1 9.6L4 11L4 13L5.1 14.4L5.1 16.6L6 18L7.5 18.9L8 20.5L9.6 21.1L10.4 22H13.6L14.4 21.1L16 20.5L16.5 18.9L18 18L18.9 16.6L18.9 14.4L20 13V11L18.9 9.6L18.9 7.4L18 6L16.5 5.1L16 3.5L14.4 2.9L13.6 2H10.4ZM12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C15.31 6 18 8.69 18 12C18 15.31 15.31 18 12 18Z" fill={iconColor} />
    </svg>
);

export const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M10 6V10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
