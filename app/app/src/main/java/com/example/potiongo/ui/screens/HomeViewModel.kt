package com.example.potiongo.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.data.Product
import com.example.potiongo.domain.GetAllProductUseCase
import com.example.potiongo.domain.GetAllProductUseCaseResult
import com.example.potiongo.domain.GetRoleUseCase
import com.example.potiongo.domain.GetRoleUseCaseResult
import com.example.potiongo.domain.LogoutUseCase
import com.example.potiongo.domain.LogoutUseCaseResult
import com.example.potiongo.repository.ProductRepository
import com.example.potiongo.services.AuthService
import com.example.potiongo.ui.screens.auth.login.LoginUiState
import com.google.firebase.auth.FirebaseAuth
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    val logoutUseCase: LogoutUseCase ,
    val getRoleUseCase: GetRoleUseCase ,
    val getAllProductUseCase: GetAllProductUseCase
): ViewModel() {
    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.CustomerView)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private val _products = MutableStateFlow<List<Product>>(emptyList())
    val products: StateFlow<List<Product>> = _products.asStateFlow()

    init {
        witchRole()
        getAllProduct()
    }

    fun witchRole(){
        viewModelScope.launch {
            when(val res = getRoleUseCase()){
                is GetRoleUseCaseResult.Customer -> {
                    _uiState.value = HomeUiState.CustomerView
                }
                is GetRoleUseCaseResult.Driver -> {
                    _uiState.value = HomeUiState.DriverView
                }
                is GetRoleUseCaseResult.ErrorAuth -> {
                    _uiState.value = HomeUiState.Error(res.errorMessage)
                }
            }
        }
    }

    fun getAllProduct(){
        viewModelScope.launch {
            when(val res = getAllProductUseCase()){
                is GetAllProductUseCaseResult.Success -> {
                    _products.value =  res.products
                }
                is GetAllProductUseCaseResult.Error -> {
                    _uiState.value = HomeUiState.ErrorProduct

                }
            }
        }
    }


    fun signOut(){
        viewModelScope.launch {
            when(val res = logoutUseCase()){
                is LogoutUseCaseResult.ErrorAuth -> {
                    _uiState.value = HomeUiState.Error(res.errorMessage)
                }
                is LogoutUseCaseResult.Success -> {
                    _uiState.value = HomeUiState.IsSignOut
                }
            }
        }
    }
}

