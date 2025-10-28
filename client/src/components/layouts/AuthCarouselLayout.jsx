import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Import assets
import logo from '/XPLogo.png';
import image1 from '/XparkBackdrop4.jpg';
import image2 from '/VR.png';
import image3 from '/Keyboard.png';

const carouselImages = [image1, image2, image3];

const AuthCarouselLayout = ({ children }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % carouselImages.length);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? carouselImages.length - 1 : prev - 1
    );
  };

  useEffect(() => {
    const slideInterval = setInterval(handleNext, 2000);

    return () => clearInterval(slideInterval);
  }, [handleNext]); 

  return (
    <div className="h-screen bg-background text-foreground flex flex-col lg:flex-row overflow-hidden">
      <Link to="/">
        <img src={logo} alt="XPARK Logo" className="fixed top-6 left-6 h-7 z-50 dark:filter-none filter invert" />
      </Link>

      {/* Left Content */}
      <div className="w-full lg:w-1/2 bg-background p-8 flex flex-col justify-center overflow-y-auto no-scrollbar">
        <div className="max-w-md mx-auto w-full mt-16 lg:mt-0">
          {children}
        </div>
      </div>

      {/* Right Carousel */}
      <div className="hidden lg:block lg:w-1/2 relative bg-secondary">
        <div className="absolute inset-0">
          {carouselImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          ))}
        </div>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black opacity-40"></div>

        {/* Navigation Arrows */}
        <div className="absolute bottom-6 right-6 flex space-x-4 z-50">
          <button
            onClick={handlePrev}
            className="p-2 rounded-full border border-white/50 transition hover:bg-white/10"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-full border border-white/50 transition hover:bg-white/10"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthCarouselLayout;