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
        console.log('[v0] Trending hashtags response:', response);
        setTrendingTags(response.data || []);
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
      background: var(--s1);
      border: 1px solid var(--b1);
      border-radius: 12px;
      overflow: hidden;
    }
    .tr-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 13px 16px;
      border-bottom: 1px solid var(--b1);
      background: linear-gradient(90deg, rgba(232,25,44,.05) 0%, transparent 70%);
    }
    .tr-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--t2);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .tr-title em {
      color: var(--red);
      font-style: normal;
    }
    .tr-more {
      font-size: 12px;
      color: var(--t3);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      font-family: var(--fb);
      font-weight: 600;
      letter-spacing: .5px;
      transition: color .15s;
    }
    .tr-more:hover {
      color: var(--red);
    }
    .tr-item {
      display: flex;
      align-items: center;
      gap: 13px;
      padding: 11px 16px;
      border-bottom: 1px solid var(--b1);
      cursor: pointer;
      transition: background .15s;
    }
    .tr-item:last-child {
      border-bottom: none;
    }
    .tr-item:hover {
      background: var(--s2);
    }
    .tr-idx {
      font-size: 12px;
      font-weight: 600;
      color: var(--t4);
      width: 18px;
      flex-shrink: 0;
    }
    .tr-body {
      flex: 1;
      min-width: 0;
    }
    .tr-tag {
      font-size: 15px;
      font-weight: 700;
      color: var(--t1);
      transition: color .15s;
    }
    .tr-item:hover .tr-tag {
      color: var(--red);
    }
    .tr-sub {
      font-size: 11px;
      color: var(--t3);
      font-family: var(--fm);
      margin-top: 2px;
    }
    .tr-cnt {
      font-size: 11px;
      color: var(--t3);
      font-family: var(--fm);
      flex-shrink: 0;
    }
  `;

  if (!trendingTags || trendingTags.length === 0) {
    if (loading || error) {
      return (
        <>
          <style>{css}</style>
          <div className="tr-wg">
            <div className="tr-head">
              <div className="tr-title">✦ Trending</div>
              <button className="tr-more" onClick={() => navigate('/hashtags')}>See all</button>
            </div>
            <div style={{ padding: '16px', fontSize: '13px', color: 'var(--t3)', textAlign: 'center' }}>
              {loading ? 'Loading trends...' : 'No trending hashtags'}
            </div>
          </div>
        </>
      );
    }
    return null;
  }

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
