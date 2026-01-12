import React from "react";
import { X } from "@tamagui/lucide-icons";
import {
  Button,
  Dialog,
  Sheet,
  Text,
  YStack,
  XStack,
  Paragraph,
} from "tamagui";

import { Topic } from "@speed-code/shared";

interface TopicModalProps {
  topic: Topic | null;
  onClose: () => void;
}

export const TopicModal = ({ topic, onClose }: TopicModalProps) => {
  if (!topic) return null;

  return (
    <Dialog modal open={!!topic} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="$stone900"
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={["transform", "opacity"]}
          animation={[
            "quick",
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          gap="$4"
          backgroundColor="$background"
          borderRadius="$6"
          padding="$6"
          maxWidth={500}
        >
          <Dialog.Title fontSize="$7" fontWeight="bold" color="$stone900">
            {topic.processed_input.title}
          </Dialog.Title>

          {topic.processed_input.sender && (
            <XStack
              gap="$2"
              alignItems="center"
              backgroundColor="$stone100"
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$2"
              alignSelf="flex-start"
            >
              <Text fontSize="$1" fontWeight="500" color="$stone500">
                From:
              </Text>
              <Text fontSize="$1" fontWeight="500" color="$stone700">
                {topic.processed_input.sender}
              </Text>
            </XStack>
          )}

          <YStack
            backgroundColor="$stone50"
            borderRadius="$4"
            padding="$4"
            borderWidth={1}
            borderColor="$stone200"
          >
            <Paragraph fontSize="$3" color="$stone600" lineHeight="$5">
              {topic.processed_input.content}
            </Paragraph>
          </YStack>

          <XStack gap="$3" justifyContent="flex-end">
            <Dialog.Close asChild>
              <Button size="$3" chromeless onPress={onClose} theme="alt1">
                Close
              </Button>
            </Dialog.Close>
          </XStack>

          <Dialog.Close asChild>
            <Button
              position="absolute"
              top="$4"
              right="$4"
              size="$3"
              circular
              icon={X}
              chromeless
              theme="alt2"
            />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
};
