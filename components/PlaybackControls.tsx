import { useState, useEffect } from "react";

interface PlaybackState {
  index: number;
  phase: string;
  description: string;
  totalStates: number;
}

export interface PlaybackControlsProps {
  currentState: PlaybackState | null;
  onStateChange: (index: number) => void;
  isPlaying: boolean;
  onPlayPauseChange: (playing: boolean) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export default function PlaybackControls({
  currentState,
  onStateChange,
  isPlaying,
  onPlayPauseChange,
  speed,
  onSpeedChange,
}: PlaybackControlsProps) {
  const total = currentState?.totalStates || 339;
  const current = currentState?.index || 0;

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying || !currentState) return;

    const interval = setInterval(() => {
      if (current < total - 1) {
        onStateChange(current + 1);
      } else {
        onPlayPauseChange(false);
      }
    }, Math.max(50, 200 / speed)); // 200ms at speed=1, faster at higher speeds

    return () => clearInterval(interval);
  }, [isPlaying, current, total, speed, onStateChange, onPlayPauseChange, currentState]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 28,
        right: 28,
        background: "rgba(20, 20, 22, 0.9)",
        border: "1px solid var(--ink-dim)",
        borderRadius: 8,
        padding: 16,
        width: 400,
        zIndex: 100,
      }}
    >
      {/* 进度条 */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="range"
          min="0"
          max={total - 1}
          value={current}
          onChange={(e) => {
            onPlayPauseChange(false);
            onStateChange(Number(e.target.value));
          }}
          style={{
            width: "100%",
            cursor: "pointer",
            accentColor: "var(--ink)",
          }}
        />
        <div
          style={{
            fontSize: 11,
            color: "var(--ink-dim)",
            marginTop: 4,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            {current} / {total - 1}
          </span>
          <span>{currentState?.phase}</span>
        </div>
      </div>

      {/* 描述 */}
      <div
        style={{
          fontSize: 12,
          color: "var(--ink)",
          marginBottom: 12,
          minHeight: 32,
          display: "flex",
          alignItems: "center",
        }}
      >
        {currentState?.description || "加载中..."}
      </div>

      {/* 播放控制 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => onPlayPauseChange(!isPlaying)}
          style={{
            flex: 1,
            padding: "8px 12px",
            background: isPlaying ? "var(--ink)" : "transparent",
            color: isPlaying ? "#141416" : "var(--ink)",
            border: "1px solid var(--ink-dim)",
            borderRadius: 4,
            fontSize: 12,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          {isPlaying ? "⏸ 暂停" : "▶ 播放"}
        </button>
        <button
          onClick={() => onStateChange(0)}
          style={{
            padding: "8px 12px",
            background: "transparent",
            color: "var(--ink)",
            border: "1px solid var(--ink-dim)",
            borderRadius: 4,
            fontSize: 12,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          ⏮ 重置
        </button>
      </div>

      {/* 速度控制 */}
      <div>
        <div style={{ fontSize: 11, color: "var(--ink-dim)", marginBottom: 4 }}>
          速度: {speed.toFixed(1)}x
        </div>
        <input
          type="range"
          min="0.25"
          max="4"
          step="0.25"
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          style={{
            width: "100%",
            cursor: "pointer",
            accentColor: "var(--ink)",
          }}
        />
      </div>
    </div>
  );
}
