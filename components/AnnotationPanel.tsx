"use client";

import React, { useState } from "react";

export interface AnnotationData {
  title_zh: string;
  title_en: string;
  desc_zh: string;
  desc_en: string;
  reference_image?: string;
  reference_label?: string;
}

interface AnnotationPanelProps {
  title_zh: string;
  title_en: string;
  desc_zh: string;
  desc_en: string;
  reference_image?: string;
  reference_label?: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function AnnotationPanel({
  title_zh,
  title_en,
  desc_zh,
  desc_en,
  reference_image,
  reference_label,
  position,
  onClose,
}: AnnotationPanelProps) {
  const [showReference, setShowReference] = useState(false);

  return (
    <>
      {/* 半透明背景，点击关闭 */}
      <div className="annotation-overlay" onClick={onClose} />

      {/* 标注面板 */}
      <div
        className="annotation-panel"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button className="annotation-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {/* 标题 */}
        <div className="annotation-header">
          <h3 className="annotation-title">
            {title_zh} <span className="annotation-title-en">{title_en}</span>
          </h3>
        </div>

        {/* 说明文本 */}
        <div className="annotation-content">
          <p className="annotation-desc-zh">{desc_zh}</p>
          <p className="annotation-desc-en">{desc_en}</p>
        </div>

        {/* 参考图 */}
        {reference_image && (
          <div className="annotation-reference">
            <button
              className="reference-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setShowReference(!showReference);
              }}
            >
              📷 {reference_label} {showReference ? "▾" : "▸"}
            </button>

            {showReference && (
              <div className="reference-image-container">
                <img
                  src={reference_image}
                  alt={reference_label || "Reference"}
                  className="reference-image"
                  onError={(e) => {
                    console.error("Failed to load reference image:", reference_image);
                  }}
                />
                <p className="reference-credit">{reference_label}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leader line (线条指向被点击的部件) */}
      <svg className="annotation-leader-svg">
        <line
          x1={position.x}
          y1={position.y}
          x2={position.x - 80}
          y2={position.y}
          className="annotation-leader-line"
        />
      </svg>
    </>
  );
}
