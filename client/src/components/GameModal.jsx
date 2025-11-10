// --- /frontend/src/components/GameModal.jsx ---
import { Bookmark, Play, Star, Trophy, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useGames } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import RatingModal from "./RatingModal";

const GameModal = ({ game, isOpen, onClose, onGameUpdate }) => {
  const { saveGame, unsaveGame, isGameSaved, startGame } = useGames();
  const { user } = useAuth();

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  if (!isOpen || !game) return null;

  const {
    _id,
    title,
    imageUrl,
    description,
    category,
    sponsor,
    gameUrl,
    isComingSoon,
    averageRating,
    numRatings,
    ratings,
  } = game;

  const isPlayable = gameUrl && !isComingSoon;
  const isSaved = isGameSaved(_id);

  const userRating = ratings?.find((r) => r.user === user?._id);
  const hasRated = !!userRating;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSaveToggle = () => {
    isSaved ? unsaveGame(_id) : saveGame(game);
  };

  const handlePlayClick = () => {
    if (isPlayable) {
      startGame(game);
      onClose();
    }
  };

  const handleRatingSuccess = (updatedGame) => {
    onGameUpdate(updatedGame);
    setIsRatingModalOpen(false);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[100] p-4 transition-opacity duration-300 animate-in fade-in"
        onClick={handleBackdropClick}
      >
        <div className="relative bg-card text-card-foreground rounded-2xl w-full max-w-lg overflow-hidden border border-border shadow-2xl animate-in fade-in zoom-in-95">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/30 p-1.5 rounded-full text-white hover:bg-black/60 transition z-10"
          >
            <X size={20} />
          </button>

          <div className="relative h-56">
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          </div>

          <div className="p-8 pt-0 -mt-10 relative z-0">
            <h1 className="text-3xl font-bold mb-3 text-card-foreground">{title}</h1>
            <p className="text-muted-foreground mb-6 leading-relaxed line-clamp-4">
              {description}
            </p>

            <div className="flex items-center justify-between gap-4 mb-8">
              {isPlayable ? (
                <Link to={gameUrl} onClick={handlePlayClick} className="flex-shrink-0">
                  <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg shadow-blue-500/20">
                    <Play size={20} className="fill-current" />
                    <span>Play</span>
                  </button>
                </Link>
              ) : (
                <button className="flex items-center gap-2 bg-muted text-muted-foreground font-bold py-3 px-8 rounded-lg cursor-not-allowed">
                  <span>{isComingSoon ? "Coming Soon" : "Not Available"}</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveToggle}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors p-3 rounded-lg hover:bg-secondary"
                  title={isSaved ? "Unsave game" : "Save for Later"}
                >
                  <Bookmark
                    size={20}
                    className={`transition-all ${
                      isSaved ? "fill-current text-primary" : ""
                    }`}
                  />
                  <span>{isSaved ? "Saved" : "Save"}</span>
                </button>

                {!isComingSoon &&
                  (hasRated ? (
                    <div
                      className="flex items-center gap-2 text-yellow-400 p-3 rounded-lg bg-secondary"
                      title={`You rated this ${userRating.rating} stars`}
                    >
                      <Star size={20} className="fill-current" />
                      <span>{userRating.rating} / 5</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsRatingModalOpen(true)}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors p-3 rounded-lg hover:bg-secondary"
                      title="Rate the game"
                    >
                      <Star size={20} />
                      <span>Rate</span>
                    </button>
                  ))}
              </div>
            </div>

            <div
              className={`grid ${
                isComingSoon ? "grid-cols-2" : "grid-cols-3"
              } gap-6 text-sm`}
            >
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
                  Category
                </p>
                <div className="flex items-center gap-2">
                  <Trophy className="text-yellow-400" size={18} />
                  <span className="text-card-foreground font-semibold">{category}</span>
                </div>
              </div>

              {/* --- THIS IS THE FIX: Reverted to only show global averageRating --- */}
              {!isComingSoon && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
                    Rating
                  </p>
                  <div className="flex items-center gap-2">
                    <Star className="text-yellow-400 fill-yellow-400" size={18} />
                    <span className="text-card-foreground font-semibold">
                      {averageRating ? averageRating.toFixed(1) : "N/A"}
                    </span>
                    <span className="text-muted-foreground">
                      ({numRatings})
                    </span>
                  </div>
                </div>
              )}

              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
                  Sponsor
                </p>
                <div className="flex items-center gap-2">
                  <Users className="text-cyan-400" size={18} />
                  <span className="text-card-foreground font-semibold">
                    {sponsor}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RatingModal
        isOpen={isRatingModalOpen}
        game={game}
        onClose={() => setIsRatingModalOpen(false)}
        onSuccess={handleRatingSuccess}
      />
    </>
  );
};

export default GameModal;