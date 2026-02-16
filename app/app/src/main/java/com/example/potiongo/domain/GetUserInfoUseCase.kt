package com.example.potiongo.domain

import com.example.potiongo.data.User
import com.example.potiongo.repository.UserRepository
import com.example.potiongo.services.AuthService
import javax.inject.Inject

private const val TAG : String = "GetUserInfoUseCaseResult"

sealed interface GetUserInfoUseCaseResult {
    data class Success(val user : User) : GetUserInfoUseCaseResult
    data object Error : GetUserInfoUseCaseResult
}


class GetUserInfoUseCase @Inject constructor(
    private val userRepository: UserRepository,
    private val auth : AuthService
){
    suspend operator fun invoke() : GetUserInfoUseCaseResult {
        val uid = auth.getUid() ?: return GetUserInfoUseCaseResult.Error
        val user = userRepository.getUserInfo(uid) ?: return GetUserInfoUseCaseResult.Error
        return GetUserInfoUseCaseResult.Success(user)
    }
}