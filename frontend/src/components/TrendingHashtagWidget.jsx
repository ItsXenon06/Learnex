import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import hashtagService from '../services/hashtagService';

const TrendingHashtagWidget = () => {
  const [trendingTags, setTrendingTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrendingHashtags = async () => {
      try {
        setLoading(true);
        const response = await hashtagService.getTrendingHashtags(5);
        setTrendingTags(response.data.data || []);
        setError(null);
      } catch (err) {
        console.error('[v0] Error fetching trending hashtags:', err);
        setError('Failed to load trending hashtags');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingHashtags();
  }, []);

  const handleHashtagClick = (tag) => {
    navigate(`/hashtags/${encodeURIComponent(tag)}`);
  };

  if (loading) return <div className="text-sm text-muted-foreground p-4">Loading...</div>;
  if (error) return null;
  if (!trendingTags || trendingTags.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Trending Hashtags</h3>
      </div>

      <div className="space-y-2">
        {trendingTags.map((tag, index) => (
          <div
            key={tag}
            onClick={() => handleHashtagClick(tag)}
            className="flex items-center gap-3 p-2 hover:bg-accent rounded cursor-pointer transition-colors"
          >
            <span className="text-xs text-muted-foreground font-semibold w-6">#{index + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary truncate">#{tag}</p>
            </div>
            <span className="text-xs text-muted-foreground">→</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/hashtags')}
        className="w-full mt-4 px-3 py-2 text-sm text-primary hover:bg-accent rounded transition-colors"
      >
        See All
      </button>
    </div>
  );
};

export default TrendingHashtagWidget;
