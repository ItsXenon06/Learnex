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

  // CSS styling to match the rest of the widgets
  const css = `
    .tr-wg {
      background: var(--bg1);
      border: 1px solid var(--b1);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .tr-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .tr-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--t0);
    }
    .tr-more {
      font-size: 12px;
      color: var(--primary);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      font-family: var(--fm);
    }
    .tr-more:hover {
      text-decoration: underline;
    }
    .tr-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
      margin-bottom: 4px;
    }
    .tr-item:hover {
      background: var(--bg2);
    }
    .tr-idx {
      font-size: 11px;
      font-weight: 600;
      color: var(--t2);
      min-width: 20px;
    }
    .tr-tag {
      flex: 1;
      min-width: 0;
      font-size: 13px;
      font-weight: 500;
      color: var(--primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;

  if (loading) return null;
  if (error) return null;
  if (!trendingTags || trendingTags.length === 0) return null;

  return (
    <>
      <style>{css}</style>
      <div className="tr-wg">
        <div className="tr-head">
          <div className="tr-title">✦ Trending</div>
          <button className="tr-more" onClick={() => navigate('/hashtags')}>See all</button>
        </div>

        <div>
          {trendingTags.map((tag, index) => (
            <div
              key={tag}
              onClick={() => handleHashtagClick(tag)}
              className="tr-item"
            >
              <span className="tr-idx">#{index + 1}</span>
              <div className="tr-tag">#{tag}</div>
              <span style={{ fontSize: '12px', color: 'var(--t2)' }}>→</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default TrendingHashtagWidget;
