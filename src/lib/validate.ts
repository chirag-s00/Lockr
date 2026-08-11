import { z } from 'zod'
import { NextResponse } from 'next/server'

type ValidationSuccess<T> = {
  success: true
  data: T
}

type ValidationFailure = {
  success: false
  response: NextResponse
}

export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationSuccess<T> | ValidationFailure {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errors = result.error.issues.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }))

    return {
      success: false,
      response: NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      ),
    }
  }

  return {
    success: true,
    data: result.data,
  }
}