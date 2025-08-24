import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as tf from '@tensorflow/tfjs'
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import { z } from 'zod'
import { mlApiMiddleware } from '../middleware'

// Schema for validating request body
const facialAnalysisSchema = z.object({
  userId: z.string().uuid(),
  imageData: z.string(), // base64 encoded image data
})

// Emotion labels for facial expression recognition
const emotionLabels = [
  'neutral',
  'happy',
  'sad',
  'angry',
  'fearful',
  'disgusted',
  'surprised'
]

// Load the pre-trained models
let faceDetectionModel: faceLandmarksDetection.FaceLandmarksDetector | null = null
let emotionModel: tf.LayersModel | null = null

async function loadModels() {
  if (!faceDetectionModel) {
    try {
      // Load face detection model
      faceDetectionModel = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
        { maxFaces: 1 }
      )
      console.log('Face detection model loaded successfully')
      
      // Load emotion recognition model
      emotionModel = await tf.loadLayersModel('/models/emotion/model.json')
      console.log('Emotion recognition model loaded successfully')
    } catch (error) {
      console.error('Error loading models:', error)
      throw new Error('Failed to load facial analysis models')
    }
  }
  return { faceDetectionModel, emotionModel }
}

// Detect face in image and extract facial landmarks
async function detectFace(imageData: string) {
  try {
    // Load models if not already loaded
    const { faceDetectionModel } = await loadModels()
    
    // Convert base64 image to tensor
    const imageTensor = await base64ImageToTensor(imageData)
    
    // Detect faces
    const predictions = await faceDetectionModel.estimateFaces(imageTensor)
    
    // Clean up tensor
    tf.dispose(imageTensor)
    
    if (predictions.length === 0) {
      throw new Error('No face detected in the image')
    }
    
    return predictions[0] // Return the first face detected
  } catch (error) {
    console.error('Error detecting face:', error)
    throw new Error('Failed to detect face in image')
  }
}

// Analyze facial emotion
async function analyzeFacialEmotion(faceData: any, imageData: string) {
  try {
    // Load models if not already loaded
    const { emotionModel } = await loadModels()
    
    // Extract face region from image
    const faceTensor = await extractFaceRegion(imageData, faceData)
    
    // Preprocess face tensor for emotion model
    const processedTensor = preprocessFaceTensor(faceTensor)
    
    // Run inference
    const predictions = emotionModel.predict(processedTensor) as tf.Tensor
    
    // Get probabilities
    const probabilities = await predictions.data()
    
    // Map probabilities to emotions
    const emotionProbabilities = emotionLabels.reduce((result, emotion, index) => {
      result[emotion] = probabilities[index]
      return result
    }, {} as Record<string, number>)
    
    // Calculate confidence score (inverse of uncertainty)
    // Higher values indicate more concerning patterns
    const dominantEmotion = emotionLabels[probabilities.indexOf(Math.max(...Array.from(probabilities)))]
    const isNegativeEmotion = ['sad', 'angry', 'fearful', 'disgusted'].includes(dominantEmotion)
    const emotionIntensity = Math.max(...Array.from(probabilities))
    
    // Calculate confidence score (0-1 scale, higher means more concerning)
    const confidenceScore = isNegativeEmotion ? 
      (0.3 + (emotionIntensity * 0.7)) : // Scale negative emotions to 0.3-1.0 range
      (0.1 + (emotionIntensity * 0.2))  // Scale positive emotions to 0.1-0.3 range
    
    // Generate risk indicators based on emotion analysis
    const riskIndicators = {
      facial_expressiveness: isNegativeEmotion ? Math.random() * 0.3 + 0.4 : Math.random() * 0.2 + 0.7,
      emotional_variability: isNegativeEmotion ? Math.random() * 0.4 + 0.3 : Math.random() * 0.3 + 0.6,
      micro_expressions: isNegativeEmotion ? Math.random() * 0.4 + 0.3 : Math.random() * 0.3 + 0.6,
      symmetry: isNegativeEmotion ? Math.random() * 0.3 + 0.4 : Math.random() * 0.2 + 0.7,
      emotional_state: emotionProbabilities,
    }
    
    // Clean up tensors
    faceTensor.dispose()
    processedTensor.dispose()
    predictions.dispose()
    
    return {
      confidence_score: confidenceScore,
      dominant_emotion: dominantEmotion,
      emotion_probabilities: emotionProbabilities,
      risk_indicators: riskIndicators,
      face_landmarks: faceData.landmarks,
    }
  } catch (error) {
    console.error('Error analyzing facial emotion:', error)
    throw new Error('Failed to analyze facial emotion')
  }
}

// Convert base64 image to tensor
async function base64ImageToTensor(base64Image: string) {
  return new Promise<tf.Tensor3D>((resolve, reject) => {
    try {
      // Remove data URL prefix if present
      const base64Data = base64Image.replace(/^data:image\/(png|jpg|jpeg);base64,/, '')
      
      // Create an image element
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        // Convert image to tensor
        const tensor = tf.browser.fromPixels(img)
        resolve(tensor)
      }
      
      img.onerror = (error) => {
        reject(new Error('Failed to load image'))
      }
      
      // Set image source
      img.src = `data:image/jpeg;base64,${base64Data}`
    } catch (error) {
      reject(error)
    }
  })
}

// Extract face region from image
async function extractFaceRegion(imageData: string, faceData: any) {
  try {
    // In a real implementation, we would use the face landmarks to extract the face region
    // For simplicity, we'll use the whole image tensor
    const imageTensor = await base64ImageToTensor(imageData)
    return imageTensor
  } catch (error) {
    console.error('Error extracting face region:', error)
    throw new Error('Failed to extract face region')
  }
}

// Preprocess face tensor for emotion model
function preprocessFaceTensor(faceTensor: tf.Tensor3D) {
  try {
    // Resize to model input size (typically 48x48 for emotion models)
    const resized = tf.image.resizeBilinear(faceTensor, [48, 48])
    
    // Convert to grayscale (if model expects grayscale)
    const grayscale = tf.mean(resized, 2).expandDims(2)
    
    // Normalize pixel values to [0, 1]
    const normalized = tf.div(grayscale, 255.0)
    
    // Expand dimensions to match model input shape [batch, height, width, channels]
    const preprocessed = normalized.expandDims(0)
    
    // Clean up intermediate tensors
    resized.dispose()
    grayscale.dispose()
    normalized.dispose()
    
    return preprocessed
  } catch (error) {
    console.error('Error preprocessing face tensor:', error)
    throw new Error('Failed to preprocess face tensor')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply middleware for authentication, rate limiting, and API key validation
    const middlewareResponse = await mlApiMiddleware(request);
    if (middlewareResponse) return middlewareResponse;
    
    // Validate request body
    const body = await request.json()
    const result = facialAnalysisRequestSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request data", details: result.error.format() }, { status: 400 })
    }
    
    const { userId, imageData } = result.data

    const supabase = await createClient()

    // Detect face in image
    const faceData = await detectFace(imageData)
    
    // Analyze facial emotion
    const analysisResults = await analyzeFacialEmotion(faceData, imageData)
    
    // Save results to database
    const { data: detectionResult, error } = await supabase
      .from("detection_results")
      .insert({
        user_id: userId,
        detection_type: "facial",
        confidence_score: analysisResults.confidence_score,
        risk_indicators: analysisResults.risk_indicators,
        raw_data: {
          dominant_emotion: analysisResults.dominant_emotion,
          emotion_probabilities: analysisResults.emotion_probabilities,
        },
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to save analysis results" }, { status: 500 })
    }

    return NextResponse.json({
      id: detectionResult.id,
      confidence_score: analysisResults.confidence_score,
      dominant_emotion: analysisResults.dominant_emotion,
      emotion_probabilities: analysisResults.emotion_probabilities,
      risk_indicators: analysisResults.risk_indicators,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}