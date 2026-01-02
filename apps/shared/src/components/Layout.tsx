import { styled, YStack, XStack, Text } from "tamagui";

export const PageWrapper = styled(YStack, {
    flex: 1,
    backgroundColor: "$background",
    alignItems: "center",
    paddingTop: "$10", // Approx 40px/2.5rem
    paddingHorizontal: "$4",
    position: "relative",
    overflow: "hidden",
    minHeight: "100vh",
    width: "100%",
    $gtMd: {
        paddingTop: "$12", // More padding on desktop
    },
});

export const HeaderContainer = styled(XStack, {
    alignItems: "center",
    gap: "$3",
    zIndex: 20,
});

export const HeaderText = styled(Text, {
    fontSize: "$6",
    fontWeight: "bold",
    color: "$stone900",
    letterSpacing: -1,
});

export const LiveCardContainer = styled(XStack, {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: "$full",
    borderWidth: 1,
    borderColor: "$stone200",
    paddingHorizontal: "$4",
    paddingVertical: "$2",
    alignItems: "center",
    gap: "$3",
    marginTop: "$8",
    cursor: "pointer",
    hoverStyle: {
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        scale: 1.02,
    },
    pressStyle: {
        scale: 0.98,
    },
    animation: "quick",
});

export const QueueCardContainer = styled(YStack, {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: "$6",
    borderWidth: 1,
    borderColor: "$stone200",
    padding: "$5",
    width: "100%",
    shadowColor: "$stone900",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
});

export const QueueItemContainer = styled(XStack, {
    alignItems: "center",
    justifyContent: "space-between",
    padding: "$3",
    borderRadius: "$4",
    borderWidth: 1,
    borderColor: "transparent",
    cursor: "pointer",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginBottom: "$2",
    hoverStyle: {
        borderColor: "$purpleLight",
        backgroundColor: "$backgroundHover",
    },
    variants: {
        active: {
            true: {
                backgroundColor: "$background",
                borderColor: "$purpleLight",
                shadowColor: "$purple",
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
        },
    } as const,
});

export const QueueHeader = styled(XStack, {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "$3",
});

export const QueueTitle = styled(Text, {
    fontSize: "$2", // xs
    fontWeight: "bold",
    color: "$stone400",
    textTransform: "uppercase",
    letterSpacing: 1,
});

export const QueueCount = styled(Text, {
    fontSize: "$1", // 10px
    color: "$stone400",
    fontWeight: "500",
    backgroundColor: "$stone100",
    paddingHorizontal: "$2",
    paddingVertical: "$1",
    borderRadius: "$full",
    overflow: "hidden", // for borderRadius on Text in RN
});

export const QueueItemIcon = styled(YStack, {
    padding: "$2",
    borderRadius: "$full",
    backgroundColor: "$stone100",
    marginRight: "$3",
    variants: {
        active: {
            true: {
                backgroundColor: "$purpleLight",
            },
        },
    } as const,
});

export const QueueItemContent = styled(YStack, {
    flex: 1,
    overflow: "hidden",
    marginRight: "$2",
});

export const QueueItemTitle = styled(Text, {
    fontSize: "$3", // sm
    fontWeight: "500",
    color: "$stone700",
    ellipse: true,
    variants: {
        active: {
            true: {
                color: "$purpleDark",
            },
        },
    } as const,
});

export const QueueItemSender = styled(Text, {
    fontSize: "$1", // 10px
    color: "$stone400",
    ellipse: true,
});

export const QueueItemTimestamp = styled(Text, {
    fontSize: "$1", // 10px
    fontWeight: "500",
    color: "$stone400",
    whiteSpace: "nowrap",
});