import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string }) => ReturnType;
    };
  }
}

export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "video[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        controls: "true",
        class: "tiptap-video",
      }),
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const wrapper = document.createElement("div");
      wrapper.className = "tiptap-video-wrapper";
      const video = document.createElement("video");
      video.controls = true;
      video.className = "tiptap-video";
      video.src = node.attrs.src ?? "";
      wrapper.appendChild(video);

      return {
        dom: wrapper,
        update: (updatedNode) => {
          video.src = updatedNode.attrs.src ?? "";
          return true;
        },
        ignoreMutation: (mutation: { type: string }) =>
          mutation.type !== "selection",
      };
    };
  },

  addCommands() {
    return {
      setVideo:
        (options: { src: string }) =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name, attrs: options });
        },
    };
  },
});