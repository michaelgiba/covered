# DefaultApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createPlaybackContent**](DefaultApi.md#createplaybackcontent) | **POST** /playback-contents |  |
| [**createProcessedInput**](DefaultApi.md#createprocessedinput) | **POST** /processed-inputs |  |
| [**getProcessedInput**](DefaultApi.md#getprocessedinput) | **GET** /processed-inputs/{input_id} |  |
| [**getTopics**](DefaultApi.md#gettopics) | **GET** /topics |  |



## createPlaybackContent

> PlaybackContentSchema createPlaybackContent(playbackContentSchema)



### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { CreatePlaybackContentRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // PlaybackContentSchema
    playbackContentSchema: ...,
  } satisfies CreatePlaybackContentRequest;

  try {
    const data = await api.createPlaybackContent(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **playbackContentSchema** | [PlaybackContentSchema](PlaybackContentSchema.md) |  | |

### Return type

[**PlaybackContentSchema**](PlaybackContentSchema.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | PlaybackContentSchema |  -  |
| **0** | Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## createProcessedInput

> ProcessedInputSchema createProcessedInput(processedInputSchema)



### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { CreateProcessedInputRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // ProcessedInputSchema
    processedInputSchema: ...,
  } satisfies CreateProcessedInputRequest;

  try {
    const data = await api.createProcessedInput(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **processedInputSchema** | [ProcessedInputSchema](ProcessedInputSchema.md) |  | |

### Return type

[**ProcessedInputSchema**](ProcessedInputSchema.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | ProcessedInputSchema |  -  |
| **0** | Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getProcessedInput

> ProcessedInputSchema getProcessedInput(inputId)



### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { GetProcessedInputRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    inputId: inputId_example,
  } satisfies GetProcessedInputRequest;

  try {
    const data = await api.getProcessedInput(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **inputId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**ProcessedInputSchema**](ProcessedInputSchema.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | ProcessedInputSchema |  -  |
| **0** | Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getTopics

> TopicListSchema getTopics()



### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { GetTopicsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  try {
    const data = await api.getTopics();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**TopicListSchema**](TopicListSchema.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | TopicListSchema |  -  |
| **0** | Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

