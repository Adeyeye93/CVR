import React, { useState, useEffect } from "react";
import * as Tabs from "@radix-ui/react-tabs";

import VideoItem from "../components/VideoItem";

import { DropdownIcon } from "../../images/popup/images";

// LocalForage instances
import localforage from "localforage";

const chunksStore = localforage.createInstance({
  name: "chunks",
});

const shareLinksStore = localforage.createInstance({
  name: "shareLinks",
});

const VideosTab = () => {
  const [personalVideos, setPersonalVideos] = useState([]);
  const [sharedLinks, setSharedLinks] = useState([]);
  const [latestVideos, setLatestVideos] = useState([]);

  // Fetch personal videos
  useEffect(() => {
    const fetchVideos = async () => {
      const videos = [];
      await chunksStore.iterate((value, key) => {
        videos.push({ key, ...value });
      });

      // If no chunked videos, fallback to shareLinksStore
      if (videos.length === 0) {
        await shareLinksStore.iterate((value) => {
          videos.push(value);
        });
      }

      setPersonalVideos(videos);
    };

    fetchVideos();
  }, []);

  // Fetch shared links
  useEffect(() => {
    const fetchSharedLinks = async () => {
      const links = [];
      await shareLinksStore.iterate((value) => {
        links.push(value);
      });

      setSharedLinks(links);
    };

    fetchSharedLinks();
  }, []);

  // Set latest videos by sorting personal videos by date
  useEffect(() => {
    const sortedVideos = [...personalVideos].sort((a, b) =>
      new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp)
    );
    setLatestVideos(sortedVideos);
  }, [personalVideos]);

  return (
    <div className="video-ui">
      <Tabs.Root className="TabsRoot" defaultValue="personal">
        <Tabs.List className="TabsList" aria-label="Manage your account">
          <div className="TabsTriggerWrap">
            <Tabs.Trigger className="TabsTrigger" value="personal">
              <div className="TabsTriggerLabel">
                <span>Personal</span>
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger className="TabsTrigger" value="shared">
              <div className="TabsTriggerLabel">
                <span>Shared</span>
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger className="TabsTrigger" value="latest">
              <div className="TabsTriggerLabel">
                <span>Latest</span>
              </div>
            </Tabs.Trigger>
          </div>
        </Tabs.List>

        {/* Personal Tab */}
        <Tabs.Content className="TabsContent" value="personal">
          <div className="videos-list">
            {personalVideos.length > 0 ? (
              personalVideos.map((video, i) => (
                <VideoItem
                  title={video.title || `Video ${i + 1}`}
                  key={i}
                  date={video.date || "Unknown"}
                  thumbnail={video.thumbnail || "default-thumbnail.png"}
                />
              ))
            ) : (
              <p>No personal videos available.</p>
            )}
          </div>
        </Tabs.Content>

        {/* Shared Tab */}
        <Tabs.Content className="TabsContent" value="shared">
          <div className="videos-list">
            {sharedLinks.length > 0 ? (
              sharedLinks.map((link, i) => (
                <VideoItem
                  title={link.title || `Shared ${i + 1}`}
                  key={i}
                  date={link.link || "Unknown"}
                  thumbnail={link.thumbnail || "default-thumbnail.png"}
                />
              ))
            ) : (
              <p>No shared links available.</p>
            )}
          </div>
        </Tabs.Content>

        {/* Latest Tab */}
        <Tabs.Content className="TabsContent" value="latest">
          <div className="videos-list">
            {latestVideos.length > 0 ? (
              latestVideos.map((video, i) => (
                <VideoItem
                  title={video.title || `Video ${i + 1}`}
                  key={i}
                  date={video.date || "Unknown"}
                  thumbnail={video.thumbnail || "default-thumbnail.png"}
                />
              ))
            ) : (
              <p>No videos available.</p>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export default VideosTab;
