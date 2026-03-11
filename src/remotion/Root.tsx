// Remotion Root — register all tutorial compositions
import React from "react";
import { Composition } from "remotion";
import { TutorialComposition } from "./TutorialComposition";
import type { TutorialCompositionProps } from "./TutorialComposition";

// Default empty props for the studio preview
const DEFAULT_PROPS: TutorialCompositionProps = {
  steps: [],
  format: "16:9",
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TutorialLandscape"
        component={TutorialComposition}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ ...DEFAULT_PROPS, format: "16:9" }}
      />
      <Composition
        id="TutorialVertical"
        component={TutorialComposition}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ ...DEFAULT_PROPS, format: "9:16" }}
      />
    </>
  );
};
