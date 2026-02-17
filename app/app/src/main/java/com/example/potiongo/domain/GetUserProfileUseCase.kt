package com.example.potiongo.domain

import com.example.potiongo.data.Rating
import com.example.potiongo.data.User
import com.example.potiongo.repository.RatingRepository
import com.example.potiongo.repository.UserRepository
import javax.inject.Inject

sealed interface GetUserProfileUseCaseResult {
    data class Success(val user: User, val ratings: List<Rating>) : GetUserProfileUseCaseResult
    data object Error : GetUserProfileUseCaseResult
}

class GetUserProfileUseCase @Inject constructor(
    private val userRepository: UserRepository,
    private val ratingRepository: RatingRepository
) {
    suspend operator fun invoke(userId: String): GetUserProfileUseCaseResult {
        return try {
            val user = userRepository.getUserInfo(userId)
                ?: return GetUserProfileUseCaseResult.Error
            val ratings = ratingRepository.getRatingsForUser(userId)
            GetUserProfileUseCaseResult.Success(user, ratings)
        } catch (e: Exception) {
            GetUserProfileUseCaseResult.Error
        }
    }
}
