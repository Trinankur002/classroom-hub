import { useEffect } from "react";
import { Room } from "livekit-client";

export default function LiveTest() {

  useEffect(() => {
    const connectRoom = async () => {

      const response = await fetch(
        "http://localhost:3000/api/live-sessions/73c5d4f7-4164-444d-9aa4-6c337597ef35/start",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NTljY2QxYS1jZDYwLTQwNGItYTdjMS1lODM0MGRlMGQ1MGMiLCJlbWFpbCI6InRyaW5hbmt1cmF0YXJ0aGkzMEBnbWFpbC5jb20iLCJyb2xlIjoiVGVhY2hlciIsImlhdCI6MTc3MzE0Nzc4MywiZXhwIjoxNzczNzUyNTgzfQ.wY2-L-ZysWcGUr83CwxGSldZ-iGzEpmcxxZa3BH4ExA"
          }
        }
      );

      const data = await response.json();

      const room = new Room();

      await room.connect(
        "ws://localhost:7880",
        data.token
      );

      console.log("Connected to room:", room.name);
    };

    connectRoom();
  }, []);

  return <h1>Connecting to LiveKit...</h1>;
}