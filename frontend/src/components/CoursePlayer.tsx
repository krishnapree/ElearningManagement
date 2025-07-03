import React, { useState, useRef, useEffect } from 'react';

interface VideoMaterial {
  id: number;
  title: string;
  description: string;
  file_url: string;
  thumbnail_url?: string;
  duration?: string;
  material_type: string;
  uploaded_at: string;
  file_name: string;
  file_type: string;
  uploaded_by?: string;
}

interface CoursePlayerProps {
  materials: VideoMaterial[];
  initialMaterial?: VideoMaterial;
  onVideoComplete?: (materialId: number) => void;
}

const CoursePlayer: React.FC<CoursePlayerProps> = ({ 
  materials, 
  initialMaterial, 
  onVideoComplete
}) => {
  console.log('CoursePlayer received materials:', materials);
  console.log('CoursePlayer received initialMaterial:', initialMaterial);
  
  const [currentVideo, setCurrentVideo] = useState<VideoMaterial | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoMaterials = materials.filter(material => material.material_type === 'video');
  console.log('Filtered video materials:', videoMaterials);

  useEffect(() => {
    if (initialMaterial) {
      console.log('Setting current video from initialMaterial:', initialMaterial);
      setCurrentVideo(initialMaterial);
      const index = videoMaterials.findIndex(m => m.id === initialMaterial.id);
      console.log('Found video index:', index);
      setCurrentIndex(index >= 0 ? index : 0);
    } else if (videoMaterials.length > 0 && !currentVideo) {
      console.log('Setting current video from first material:', videoMaterials[0]);
      setCurrentVideo(videoMaterials[0]);
    }
  }, [videoMaterials, currentVideo, initialMaterial]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onVideoComplete && currentVideo) {
        onVideoComplete(currentVideo.id);
      }
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentVideo, onVideoComplete]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
  };

  const selectVideo = (material: VideoMaterial, index: number) => {
    setCurrentVideo(material);
    setCurrentIndex(index);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const nextVideo = () => {
    if (currentIndex < videoMaterials.length - 1) {
      selectVideo(videoMaterials[currentIndex + 1], currentIndex + 1);
    }
  };

  const previousVideo = () => {
    if (currentIndex > 0) {
      selectVideo(videoMaterials[currentIndex - 1], currentIndex - 1);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  };

  const getVideoType = (file_url: string | undefined) => {
    if (!file_url) return 'video/mp4';
    const extension = file_url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'ogg':
        return 'video/ogg';
      case 'avi':
        return 'video/avi';
      case 'mov':
        return 'video/quicktime';
      case 'mkv':
        return 'video/x-matroska';
      case 'flv':
        return 'video/x-flv';
      case 'wmv':
        return 'video/x-ms-wmv';
      default:
        return 'video/mp4';
    }
  };

  if (videoMaterials.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">
          <i className="fas fa-video"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Video Materials
        </h3>
        <p className="text-gray-600 mb-4">
          No video materials are available for this course yet.
        </p>
        <div className="text-sm text-gray-500">
          <p>Debug Info:</p>
          <p>Total materials received: {materials.length}</p>
          <p>Video materials filtered: {videoMaterials.length}</p>
          <p>Initial material: {initialMaterial ? 'Yes' : 'No'}</p>
        </div>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">
          <i className="fas fa-video"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Video Selected
        </h3>
        <p className="text-gray-600 mb-4">
          Please select a video from the playlist to start playing.
        </p>
        <div className="text-sm text-gray-500">
          <p>Debug Info:</p>
          <p>Total materials received: {materials.length}</p>
          <p>Video materials filtered: {videoMaterials.length}</p>
          <p>Initial material: {initialMaterial ? 'Yes' : 'No'}</p>
          <p>Current video: {currentVideo ? 'Yes' : 'No'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Video Player */}
      <div className="relative bg-black">
        <video
          ref={videoRef}
          className="w-full h-96 object-contain"
          poster={currentVideo?.thumbnail_url}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => console.error('Video error:', e)}
          onLoadStart={() => console.log('Video loading started for:', currentVideo?.file_url)}
          onLoadedData={() => console.log('Video data loaded for:', currentVideo?.file_url)}
        >
          <source src={currentVideo?.file_url} type={getVideoType(currentVideo?.file_url)} />
          Your browser does not support the video tag.
        </video>

        {/* Video Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress Bar */}
          <div className="mb-2">
            <input
              type="range"
              min="0"
              max="100"
              value={getProgressPercentage()}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <i className={`fas fa-${isPlaying ? 'pause' : 'play'} text-xl`}></i>
              </button>

              <button
                onClick={previousVideo}
                disabled={currentIndex === 0}
                className="text-white hover:text-gray-300 transition-colors disabled:text-gray-600"
              >
                <i className="fas fa-step-backward"></i>
              </button>

              <button
                onClick={nextVideo}
                disabled={currentIndex === videoMaterials.length - 1}
                className="text-white hover:text-gray-300 transition-colors disabled:text-gray-600"
              >
                <i className="fas fa-step-forward"></i>
              </button>

              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <i className="fas fa-volume-down text-sm"></i>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <button
                onClick={() => setShowPlaylist(!showPlaylist)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <i className="fas fa-list text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {currentVideo?.title}
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          {currentVideo?.description}
        </p>
        <div className="flex items-center text-xs text-gray-500 space-x-4">
          {currentVideo?.duration && (
            <span>
              <i className="fas fa-clock mr-1"></i>
              {currentVideo.duration}
            </span>
          )}
          <span>
            <i className="fas fa-calendar mr-1"></i>
            {new Date(currentVideo?.uploaded_at || '').toLocaleDateString()}
          </span>
          <span>
            Video {currentIndex + 1} of {videoMaterials.length}
          </span>
        </div>
      </div>

      {/* Playlist */}
      {showPlaylist && (
        <div className="max-h-64 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Course Videos</h4>
          </div>
          <div className="divide-y divide-gray-200">
            {videoMaterials.map((material, index) => (
              <div
                key={material.id}
                onClick={() => selectVideo(material, index)}
                className={`p-4 cursor-pointer transition-colors ${
                  currentIndex === index
                    ? 'bg-primary-50 border-l-4 border-primary-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {material.thumbnail_url ? (
                      <img
                        src={material.thumbnail_url}
                        alt={material.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <i className="fas fa-video text-gray-400"></i>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 truncate">
                      {material.title}
                    </h5>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {material.description}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 mt-2 space-x-3">
                      {material.duration && (
                        <span>
                          <i className="fas fa-clock mr-1"></i>
                          {material.duration}
                        </span>
                      )}
                      <span>
                        <i className="fas fa-calendar mr-1"></i>
                        {new Date(material.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {currentIndex === index && (
                    <div className="flex-shrink-0">
                      <i className="fas fa-play text-primary-600"></i>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePlayer; 