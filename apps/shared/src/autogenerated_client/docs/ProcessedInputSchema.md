
# ProcessedInputSchema


## Properties

Name | Type
------------ | -------------
`content` | string
`extractedLink` | string
`id` | string
`sender` | string
`timestamp` | string
`title` | string

## Example

```typescript
import type { ProcessedInputSchema } from ''

// TODO: Update the object below with actual values
const example = {
  "content": null,
  "extractedLink": null,
  "id": null,
  "sender": null,
  "timestamp": null,
  "title": null,
} satisfies ProcessedInputSchema

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ProcessedInputSchema
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


