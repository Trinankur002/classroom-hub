import {
  ConnectionState,
  Participant,
  RemoteTrackPublication,
  Room,
  RoomEvent,
  Track,
  VideoQuality,
} from "livekit-client";

type RoomStateListener = (state: {
  participants: Participant[];
  activeSpeaker: Participant | null;
  screenShareTrack: Track | null;
  connectionState: ConnectionState;
}) => void;

class LivekitRoomService {
  private room: Room | null = null;
  private listeners = new Set<RoomStateListener>();

  createRoom() {
    if (!this.room) {
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      this.bindRoomEvents(this.room);
    }
    return this.room;
  }

  getRoom() {
    return this.room;
  }

  private notifyState() {
    if (!this.room) return;
    const participants = Array.from(this.room.remoteParticipants.values());
    const localTracks = Array.from(this.room.localParticipant.trackPublications.values());
    const activeSpeaker = this.room.activeSpeakers?.[0] ?? null;
    const screenShareTrack =
      localTracks
        .map((publication) => publication.track)
        .find((track) => track?.source === Track.Source.ScreenShare) ??
      participants
      .flatMap((participant) => Array.from(participant.trackPublications.values()))
      .map((publication) => publication.track)
      .find((track) => track?.source === Track.Source.ScreenShare) ?? null;

    for (const listener of this.listeners) {
      listener({
        participants,
        activeSpeaker,
        screenShareTrack,
        connectionState: this.room.state,
      });
    }
  }

  private bindRoomEvents(room: Room) {
    room.on(RoomEvent.ParticipantConnected, () => this.notifyState());
    room.on(RoomEvent.ParticipantDisconnected, () => this.notifyState());
    room.on(RoomEvent.ActiveSpeakersChanged, () => this.notifyState());
    room.on(RoomEvent.ConnectionStateChanged, () => this.notifyState());
    room.on(RoomEvent.LocalTrackPublished, () => this.notifyState());
    room.on(RoomEvent.LocalTrackUnpublished, () => this.notifyState());
    room.on(RoomEvent.LocalTrackMuted, () => this.notifyState());
    room.on(RoomEvent.LocalTrackUnmuted, () => this.notifyState());
    room.on(RoomEvent.TrackPublished, () => this.notifyState());
    room.on(RoomEvent.TrackUnpublished, () => this.notifyState());
    room.on(RoomEvent.TrackMuted, () => this.notifyState());
    room.on(RoomEvent.TrackUnmuted, () => this.notifyState());
    room.on(RoomEvent.TrackSubscribed, () => this.notifyState());
    room.on(RoomEvent.TrackUnsubscribed, () => this.notifyState());
  }

  subscribe(listener: RoomStateListener) {
    this.listeners.add(listener);
    this.notifyState();
    return () => this.listeners.delete(listener);
  }

  async connectToRoom(token: string, url: string) {
    const room = this.createRoom();
    if (room.state === "connected" || room.state === "reconnecting") {
      return room;
    }
    await room.connect(url, token);
    this.notifyState();
    return room;
  }

  async disconnect() {
    if (!this.room) return;
    for (const publication of this.room.localParticipant.trackPublications.values()) {
      if (publication.track) {
        await this.room.localParticipant.unpublishTrack(publication.track);
      }
    }
    this.room.disconnect();
    this.notifyState();
  }

  async enableCamera() {
    await this.room?.localParticipant.setCameraEnabled(true);
  }

  async disableCamera() {
    await this.room?.localParticipant.setCameraEnabled(false);
  }

  async enableMicrophone() {
    await this.room?.localParticipant.setMicrophoneEnabled(true);
  }

  async disableMicrophone() {
    await this.room?.localParticipant.setMicrophoneEnabled(false);
  }

  async startScreenShare() {
    await this.room?.localParticipant.setScreenShareEnabled(true);
  }

  async stopScreenShare() {
    await this.room?.localParticipant.setScreenShareEnabled(false);
  }

  setParticipantVisibility(participantId: string, isVisible: boolean, tileWidth: number) {
    if (!this.room) return;
    const participant = this.room.remoteParticipants.get(participantId);
    if (!participant) return;

    let quality = VideoQuality.HIGH;
    if (tileWidth < 150) quality = VideoQuality.LOW;
    else if (tileWidth < 400) quality = VideoQuality.MEDIUM;

    participant.trackPublications.forEach((publication) => {
      const remotePublication = publication as RemoteTrackPublication;
      if (remotePublication.kind !== Track.Kind.Video) return;
      remotePublication.setSubscribed(isVisible);

      if (
        typeof (remotePublication as unknown as { setVideoQuality?: (q: VideoQuality) => void }).setVideoQuality ===
        "function"
      ) {
        (remotePublication as unknown as { setVideoQuality: (q: VideoQuality) => void }).setVideoQuality(quality);
      }
    });
  }
}

export const livekitService = new LivekitRoomService();
