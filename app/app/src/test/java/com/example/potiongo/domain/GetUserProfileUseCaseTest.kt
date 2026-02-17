package com.example.potiongo.domain

import com.example.potiongo.data.Rating
import com.example.potiongo.data.User
import com.example.potiongo.repository.RatingRepository
import com.example.potiongo.repository.UserRepository
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

class GetUserProfileUseCaseTest {

    private lateinit var userRepository: UserRepository
    private lateinit var ratingRepository: RatingRepository
    private lateinit var useCase: GetUserProfileUseCase

    @Before
    fun setUp() {
        userRepository = mock()
        ratingRepository = mock()
        useCase = GetUserProfileUseCase(userRepository, ratingRepository)
    }

    @Test
    fun `invoke returns Success with user and ratings`() = runTest {
        val user = User(id = "uid-1", firstName = "Bob")
        val ratings = listOf(Rating(id = "r1", rating = 5), Rating(id = "r2", rating = 4))
        whenever(userRepository.getUserInfo("uid-1")).thenReturn(user)
        whenever(ratingRepository.getRatingsForUser("uid-1")).thenReturn(ratings)

        val result = useCase("uid-1")

        assertTrue(result is GetUserProfileUseCaseResult.Success)
        val success = result as GetUserProfileUseCaseResult.Success
        assertEquals("Bob", success.user.firstName)
        assertEquals(2, success.ratings.size)
    }

    @Test
    fun `invoke returns Error when user not found`() = runTest {
        whenever(userRepository.getUserInfo("unknown")).thenReturn(null)

        val result = useCase("unknown")

        assertTrue(result is GetUserProfileUseCaseResult.Error)
    }

    @Test
    fun `invoke returns Error when repository throws`() = runTest {
        whenever(userRepository.getUserInfo("uid-1")).thenThrow(RuntimeException("DB error"))

        val result = useCase("uid-1")

        assertTrue(result is GetUserProfileUseCaseResult.Error)
    }
}
