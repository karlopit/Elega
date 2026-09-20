"use client";

import { useEffect, useRef, useState } from "react";
import { Map, Marker, NavigationControl } from "maplibre-gl";

const DEFAULT_CENTER = [120.9842, 14.5995];

export function AddressMap({ coordinates, onPinSettled, onLocationError }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return undefined;
    }

    const initialCenter = coordinates
      ? [coordinates.longitude, coordinates.latitude]
      : DEFAULT_CENTER;
    const map = new Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: initialCenter,
      zoom: coordinates ? 15 : 11,
      attributionControl: true
    });
    map.addControl(new NavigationControl(), "top-right");
    const marker = new Marker({ color: "#C9A24B", draggable: true })
      .setLngLat(initialCenter)
      .addTo(map);

    function settlePin(lngLat) {
      const nextCoordinates = { latitude: lngLat.lat, longitude: lngLat.lng };
      marker.setLngLat([nextCoordinates.longitude, nextCoordinates.latitude]);
      onPinSettled(nextCoordinates);
    }

    map.on("click", (event) => settlePin(event.lngLat));
    marker.on("dragend", () => settlePin(marker.getLngLat()));
    map.once("load", () => map.resize());
    const resizeTimer = window.setTimeout(() => map.resize(), 0);
    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [coordinates, onPinSettled]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !coordinates) {
      return;
    }
    const position = [coordinates.longitude, coordinates.latitude];
    markerRef.current.setLngLat(position);
    mapRef.current.flyTo({ center: position, zoom: Math.max(mapRef.current.getZoom(), 15) });
    mapRef.current.resize();
  }, [coordinates]);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      onLocationError("Your browser does not support location access. You can place the pin manually.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: position }) => {
        setLocating(false);
        const nextCoordinates = { latitude: position.latitude, longitude: position.longitude };
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [nextCoordinates.longitude, nextCoordinates.latitude], zoom: 16 });
        }
        if (markerRef.current) {
          markerRef.current.setLngLat([nextCoordinates.longitude, nextCoordinates.latitude]);
        }
        onPinSettled(nextCoordinates);
      },
      () => {
        setLocating(false);
        onLocationError("We could not access your location. Please allow location access or place the pin manually.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  return (
    <div className="mt-5">
      <div className="relative h-64 overflow-hidden rounded-sm border border-line bg-ivory" ref={containerRef} />
      <button
        className="focus-ring mt-3 border-b border-gold pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold"
        onClick={useCurrentLocation}
        type="button"
      >
        {locating ? "Locating" : "Use my current location"}
      </button>
      <p className="mt-2 text-xs leading-5 text-muted">Click the map to place a pin, then drag it to adjust.</p>
    </div>
  );
}
