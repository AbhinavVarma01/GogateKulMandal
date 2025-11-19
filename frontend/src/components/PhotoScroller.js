import React from "react";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import "./PhotoScroller.css";

const photos = [
  { src: "/Granth.jpg", key: "granth", page: "/granth" },
  { src: "/kulvruttant_samiti.jpg", key: "kulvruttant_samiti", page: "/kulvruttantsamiti" },
  { src: "/Gogte_Events.jpg", key: "gogteevents", page: "/gogte-events" },
  { src: "/Gogte_News.jpg", key: "gogtenews", page: "/gogte-news" },
  { src: "/photogallery.jpg", key: "photogallery", page: "/photo-gallery" },
  { src: "/Presidents_thoughts.jpg", key: "presidents_thoughts", page: "/presidentsthoughts" },
  { src: "/remembrance_day.jpg", key: "remembrance_day", page: "/remembrance-day" },
  { src: "/Vaatchaal.jpg", key: "vaatchaal", page: "/gogte-vaatchaal" }
];

export default function PhotoScroller({ enableClick = true }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="photo-scroller-container">
      <div className="photo-scroller-background">
        <div className="features-description">
          {t('photoscroller.features_description')}
        </div>
        <div className="photo-strip">
          {photos.concat(photos).map((item, idx) => {
            const clickableProps = enableClick
              ? {
                  style: { cursor: 'pointer' },
                  onClick: () => navigate(item.page),
                }
              : { style: { cursor: 'default' } };
            return (
              <div
                key={idx}
                className="photo-item-container"
                {...clickableProps}
              >
                <img src={item.src} alt={t(`photoscroller.${item.key}`)} className="photo-item" />
                <div className="photo-label">
                  <div className="label-text">{t(`photoscroller.${item.key}`)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}