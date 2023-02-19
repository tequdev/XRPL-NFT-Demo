export const parser = (meta: any,) => {
  const affectedNodes = meta.AffectedNodes.filter(
    (node: any) =>
      node.CreatedNode?.LedgerEntryType === 'NFTokenPage' ||
      (node.ModifiedNode?.LedgerEntryType === 'NFTokenPage' &&
        !!node.ModifiedNode?.PreviousFields.NFTokens),
  )

  const previousTokenIDSet = new Set(
    affectedNodes
      .flatMap((node: any) =>
        node.ModifiedNode?.PreviousFields?.NFTokens?.map(
          (token: any) => token.NFToken.NFTokenID,
        ),
      )
      .filter((id: any) => id),
  )

  const finalTokenIDs = affectedNodes
    .flatMap((node: any) =>
      (
        node.ModifiedNode?.FinalFields ?? node.CreatedNode?.NewFields
      )?.NFTokens?.map((token: any) => token.NFToken.NFTokenID),
    )
    .filter((id: any) => id)

  const tokenID = finalTokenIDs.find((id: any) => !previousTokenIDSet.has(id))

  return tokenID
}
