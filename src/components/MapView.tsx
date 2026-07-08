"use client";

import { useCallback, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
} from "@vis.gl/react-google-maps";
import type { StorePinData } from "@/types/store";
import PricePin from "./PricePin";

interface MapViewProps {
  pinDataList: StorePinData[];
  selectedStoreId: string | null;
  onStoreSelect: (storeId: string) => void;
  onMapMoved?: () => void;
}

// 渋谷駅を初期中心に
const SHIBUYA_CENTER = { lat: 35.6580, lng: 139.7016 };
const DEFAULT_ZOOM = 15;

export default function MapView({
  pinDataList,
  selectedStoreId,
  onStoreSelect,
  onMapMoved,
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
        style={{
          // マップのスタイルをフラットに（情報過多を避ける）
        }}
      >
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
