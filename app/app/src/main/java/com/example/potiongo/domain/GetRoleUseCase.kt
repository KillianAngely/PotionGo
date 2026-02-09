package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.data.Role
import com.example.potiongo.services.AuthService
import javax.inject.Inject


private const val TAG : String = "GetRoleUseCase"

sealed interface GetRoleUseCaseResult {
    data object Customer : GetRoleUseCaseResult
    data object Driver : GetRoleUseCaseResult
    data class ErrorAuth(val errorMessage :String) : GetRoleUseCaseResult

}


class GetRoleUseCase @Inject constructor(
    private val auth: AuthService
){
    suspend operator fun invoke() : GetRoleUseCaseResult{
        return try {
            val res = auth.getRole()
            Log.d(TAG,"GetRoleUseCase:succes:${res}")
            when(res) {
                Role.CUSTOMER -> GetRoleUseCaseResult.Customer
                Role.DRIVER -> GetRoleUseCaseResult.Driver
            }
        } catch (e : Exception){
            Log.d(TAG,"GetRoleUseCase:failed",e)
            GetRoleUseCaseResult.ErrorAuth(e.toString())
        }
    }
}