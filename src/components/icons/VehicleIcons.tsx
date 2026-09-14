import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const BusIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="3" y="4" width="18" height="14" rx="2" fill="currentColor" />
    <rect x="5" y="6" width="4" height="4" rx="1" fill="white" opacity="0.9" />
    <rect x="10" y="6" width="4" height="4" rx="1" fill="white" opacity="0.9" />
    <rect x="15" y="6" width="4" height="4" rx="1" fill="white" opacity="0.9" />
    <rect x="3" y="14" width="18" height="2" fill="currentColor" opacity="0.7" />
    <circle cx="7" cy="20" r="2" fill="currentColor" />
    <circle cx="17" cy="20" r="2" fill="currentColor" />
  </svg>
);

export const MinibusIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V16C20 17.1046 19.1046 18 18 18H6C4.89543 18 4 17.1046 4 16V6Z"
      fill="currentColor"
    />
    <rect x="6" y="6" width="5" height="4" rx="1" fill="white" opacity="0.9" />
    <rect x="13" y="6" width="5" height="4" rx="1" fill="white" opacity="0.9" />
    <rect x="4" y="12" width="16" height="2" fill="currentColor" opacity="0.6" />
    <circle cx="7" cy="20" r="2" fill="currentColor" />
    <circle cx="17" cy="20" r="2" fill="currentColor" />
  </svg>
);

export const TaxiIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M5 11L6.5 6C6.78 5.11 7.6 4.5 8.53 4.5H15.47C16.4 4.5 17.22 5.11 17.5 6L19 11"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <rect x="4" y="11" width="16" height="7" rx="2" fill="currentColor" />
    <rect x="6" y="13" width="3" height="2" rx="0.5" fill="white" opacity="0.9" />
    <rect x="15" y="13" width="3" height="2" rx="0.5" fill="white" opacity="0.9" />
    <circle cx="7" cy="20" r="2" fill="currentColor" />
    <circle cx="17" cy="20" r="2" fill="currentColor" />
    <rect x="9" y="2" width="6" height="2" rx="1" fill="currentColor" opacity="0.8" />
  </svg>
);

export const CommuterIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="7" r="4" fill="currentColor" />
    <path
      d="M4 21V19C4 16.2386 6.23858 14 9 14H15C17.7614 14 20 16.2386 20 19V21"
      fill="currentColor"
    />
  </svg>
);

export const LocationPinIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
      fill="currentColor"
    />
    <circle cx="12" cy="9" r="3" fill="white" />
  </svg>
);
