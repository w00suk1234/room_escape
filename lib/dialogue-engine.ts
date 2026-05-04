import type { DialogueLine } from "@/components/DialogueBox";
import type { DialogueNodeData } from "@/data/chapter1Dialogues";

export function dialogueNodeToLine(
  node: DialogueNodeData,
  resolveChoice: (next: string) => () => void
): DialogueLine {
  return {
    speaker: node.speaker,
    text: node.text,
    tone: node.speaker === "NODE" ? "node" : node.speaker === "ECHO" ? "echo" : "serin",
    choices: node.choices?.map((choice) => ({
      label: choice.label,
      onSelect: resolveChoice(choice.next),
    })),
  };
}
