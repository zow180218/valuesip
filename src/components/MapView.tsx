"use client";

import { useCallback, useEffect } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from "@vis.gl/react-google-maps";
import type { StorePinData, MapBounds } from "@/types/store";
import PricePin from "./PricePin";

interface MapViewProps {
  pinDataList: StorePinData[];
  selectedStoreId: string | null;
  onStoreSelect: (storeId: string) => void;
  onMapMoved?: () => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  centerOn?: { lat: number; lng: number; key: string };
  userLocation?: { lat: number; lng: number } | null;
}

// 渋谷駅を初期中心に
const SHIBUYA_CENTER = { lat: 35.6580, lng: 139.7016 };
const DEFAULT_ZOOM = 15;

/**
 * マップが idle になるたびに現在の表示境界を親に通知するコンポーネント
 * Map の子として useMap() を使用
 */
function BoundsTracker({ onBoundsChange }: { onBoundsChange?: (b: MapBounds) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !onBoundsChange) return;
    const handleIdle = () => {
      const b = map.getBounds();
      if (!b) return;
      onBoundsChange({
        north: b.getNorthEast().lat(),
        south: b.getSouthWest().lat(),
        east:  b.getNorthEast().lng(),
        west:  b.getSouthWest().lng(),
      });
    };
    // google.maps.Map#addListener は MapsEventListener を返す
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener = (map as any).addListener("idle", handleIdle);
    return () => listener?.remove?.();
  // onBoundsChange は useCallback で安定させること
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

// サジェスト選択時にマップをパンするコンポーネント（Map の子として useMap() を使用）
function MapPanner({ centerOn }: { centerOn?: { lat: number; lng: number; key: string } }) {
  const map = useMap();
  useEffect(() => {
    if (map && centerOn) {
      map.panTo({ lat: centerOn.lat, lng: centerOn.lng });
      map.setZoom(17);
    }
    // key が変わったときだけ実行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, centerOn?.key]);
  return null;
}

export default function MapView({
  pinDataList,
  selectedStoreId,
  onStoreSelect,
  onMapMoved,
  onBoundsChange,
  centerOn,
  userLocation,
}: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";

  const handleMarkerClick = useCallback(
    (storeId: string) => {
      onStoreSelect(storeId);
    },
    [onStoreSelect]
  );

  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-blue-50">
        <div className="text-center p-6 bg-white rounded-2xl shadow-float max-w-xs">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            Google Maps API キーが未設定です
          </p>
          <p className="text-xs text-gray-500">
            <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code>{" "}
            に{" "}
            <code className="bg-gray-100 px-1 py-0.5 rounded">
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
            </code>{" "}
            を設定してください
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={SHIBUYA_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        mapId={mapId}
        gestureHandling="greedy"
        disableDefaultUI={true}
        onDragend={onMapMoved}
        className="w-full h-full"
      >
        <MapPanner centerOn={centerOn} />
        <BoundsTracker onBoundsChange={onBoundsChange} />

        {/* 現在地マーカー（青い●） */}
        {userLocation && (
          <AdvancedMarker position={userLocation} zIndex={200}>
            <div className="relative flex items-center justify-center">
              {/* 外側の波紋 */}
              <div className="absolute w-10 h-10 rounded-full bg-blue-400/30 animate-ping" />
              {/* 内側の青い● */}
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
            </div>
          </AdvancedMarker>
        )}

        {pinDataList.map((pinData) => (
          <AdvancedMarker
            key={pinData.store.store_id}
            position={{ lat: pinData.store.lat, lng: pinData.store.lng }}
            onClick={() => handleMarkerClick(pinData.store.store_id)}
            zIndex={
              pinData.store.store_id === selectedStoreId
                ? 100
                : pinData.isHH
                ? 50
                : pinData.isInBudget
                ? 10
                : 1
            }
          >
            <PricePin
              pinData={pinData}
              isSelected={pinData.store.store_id === selectedStoreId}
            />
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}
