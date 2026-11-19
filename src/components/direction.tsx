/* Imported from the registry as published; the hook exported beside the components is upstream's. */
/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import * as Direction from "@radix-ui/react-direction"

function DirectionProvider({
  dir,
  direction,
  children,
}: React.ComponentProps<typeof Direction.DirectionProvider> & {
  direction?: React.ComponentProps<typeof Direction.DirectionProvider>["dir"]
}) {
  return (
    <Direction.DirectionProvider dir={direction ?? dir}>
      {children}
    </Direction.DirectionProvider>
  )
}

const useDirection = Direction.useDirection

export { DirectionProvider, useDirection }
